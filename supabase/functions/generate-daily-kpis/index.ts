import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import dayjs from 'https://esm.sh/dayjs@1.11.10'
import utc from 'https://esm.sh/dayjs@1.11.10/plugin/utc'
import timezone from 'https://esm.sh/dayjs@1.11.10/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Helper to calculate shift duration in hours, considering breaks
function calculateScheduledHours(shift: { start_time: string, end_time: string, break_times?: Array<{ breakStart: string, breakEnd: string, breakType?: string }> }): number {
  // Assumes shift_date is the same for start and end for simplicity here, or handled by dayjs parsing if times cross midnight
  const startDateTime = dayjs(`2000-01-01T${shift.start_time}`); // Use a fixed date for time-only calculations
  let endDateTime = dayjs(`2000-01-01T${shift.end_time}`);

  if (endDateTime.isBefore(startDateTime)) {
    endDateTime = endDateTime.add(1, 'day');
  }

  let totalDurationMinutes = endDateTime.diff(startDateTime, 'minute');
  let unpaidBreakMinutes = 0;

  if (shift.break_times) {
    for (const breakPeriod of shift.break_times) {
      // Assuming breakType 'paid' means it does not reduce sched_hours for KPI purposes
      if (breakPeriod.breakType?.toLowerCase() !== 'paid') {
        const breakStart = dayjs(`2000-01-01T${breakPeriod.breakStart}`);
        let breakEnd = dayjs(`2000-01-01T${breakPeriod.breakEnd}`);
        if (breakEnd.isBefore(breakStart)) {
          breakEnd = breakEnd.add(1, 'day');
        }
        unpaidBreakMinutes += breakEnd.diff(breakStart, 'minute');
      }
    }
  }

  const netDurationMinutes = totalDurationMinutes - unpaidBreakMinutes;
  return parseFloat((netDurationMinutes / 60).toFixed(2));
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured.');
    }
    const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });

    const requestBody = await req.json().catch(() => ({}));
    const targetDateInput = requestBody?.targetDate;

    const reportDate = targetDateInput ? dayjs(targetDateInput).tz("Europe/London") : dayjs().tz("Europe/London").subtract(1, 'day');
    const reportDateStr = reportDate.format('YYYY-MM-DD');
    const startOfDay = reportDate.startOf('day').toISOString();
    const endOfDay = reportDate.endOf('day').toISOString();

    console.log(`Generating KPIs for report_date: ${reportDateStr}`);

    // 1. Fetch EDOB data for patrols and breaks
    const { data: edobEntries, error: edobError } = await adminSupabase
      .from('edob_entries')
      .select('type, details, guard_user_id') // Assuming 'type' helps identify patrols/breaks
      .gte('timestamp', startOfDay)
      .lte('timestamp', endOfDay);
    if (edobError) throw edobError;

    let total_patrols = 0;
    let total_breaks_logged = 0;
    const guardsWithPatrols = new Map<string, number>();
    const guardsWithBreaks = new Set<string>(); // To count unique guards logging breaks

    (edobEntries || []).forEach(entry => {
      // Crude check, refine based on actual EDOB entry types/details
      if (entry.type?.toLowerCase().includes('patrol') || entry.details?.toLowerCase().includes('patrol')) {
        total_patrols++;
        if (entry.guard_user_id) {
            guardsWithPatrols.set(entry.guard_user_id, (guardsWithPatrols.get(entry.guard_user_id) || 0) + 1);
        }
      }
      if (entry.type?.toLowerCase().includes('break') || entry.details?.toLowerCase().includes('break')) {
        total_breaks_logged++;
        if (entry.guard_user_id) guardsWithBreaks.add(entry.guard_user_id);
      }
    });

    const raw_patrols_per_guard_data = Object.fromEntries(guardsWithPatrols);

    // 2. Fetch Uniform Checks
    const { data: uniformChecks, error: uniformError } = await adminSupabase
      .from('uniform_checks')
      .select('guard_id, checklist_items') // Assuming checklist_items has { ..., confirmed: boolean }
      .gte('check_timestamp', startOfDay)
      .lte('check_timestamp', endOfDay);
    if (uniformError) throw uniformError;

    let compliantChecks = 0;
    const checkedGuardIds = new Set<string>();
    (uniformChecks || []).forEach(check => {
      if (check.guard_id) checkedGuardIds.add(check.guard_id);
      const items = check.checklist_items as Array<{ confirmed: boolean }>;
      if (items.every(item => item.confirmed)) {
        compliantChecks++;
      }
    });
    const totalUniqueGuardsChecked = checkedGuardIds.size;
    const uniform_compliance_percentage = totalUniqueGuardsChecked > 0 ? parseFloat(((compliantChecks / totalUniqueGuardsChecked) * 100).toFixed(2)) : 100.00;


    // 3. Fetch Shifts to determine guards_on_duty and for patrol target calculations
    const { data: shiftsToday, error: shiftsError } = await adminSupabase
      .from('shifts')
      .select('guard_user_id, start_time, end_time, break_times') // Add other fields if needed for patrol targets
      .eq('shift_date', reportDateStr);
    if (shiftsError) throw shiftsError;

    const guards_on_duty = new Set((shiftsToday || []).map(s => s.guard_user_id)).size;

    // Patrol Target Calculation (example: 3 patrols per guard on duty)
    const PATROL_TARGET_PER_GUARD = 3;
    const expectedTotalPatrols = guards_on_duty * PATROL_TARGET_PER_GUARD;
    const patrol_target_achieved_percentage = expectedTotalPatrols > 0
        ? parseFloat(((total_patrols / expectedTotalPatrols) * 100).toFixed(2))
        : (total_patrols > 0 ? 100.00 : 0.00) ; // If no guards expected, 100% if any patrol done, else 0.

    const patrols_per_guard_avg = guards_on_duty > 0
        ? parseFloat((total_patrols / guards_on_duty).toFixed(2))
        : 0.00;

    // Construct KPI record
    const kpiRecord = {
      report_date: reportDateStr,
      total_patrols,
      patrol_target_achieved_percentage,
      total_breaks_logged,
      uniform_compliance_percentage,
      guards_on_duty,
      patrols_per_guard_avg,
      raw_patrols_per_guard_data,
      generated_at: new Date().toISOString(),
    };

    // Upsert into daily_kpi_metrics
    const { error: upsertError } = await adminSupabase
      .from('daily_kpi_metrics')
      .upsert(kpiRecord, { onConflict: 'report_date' });

    if (upsertError) throw upsertError;

    console.log(`KPIs for ${reportDateStr} generated and saved successfully.`);
    return new Response(
      JSON.stringify({ message: `KPIs for ${reportDateStr} generated successfully.`, data: kpiRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-daily-kpis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
