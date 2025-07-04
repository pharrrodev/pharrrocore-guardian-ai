import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import dayjs from 'https://esm.sh/dayjs@1.11.10'
import isSameOrBefore from 'https://esm.sh/dayjs@1.11.10/plugin/isSameOrBefore'
import isSameOrAfter from 'https://esm.sh/dayjs@1.11.10/plugin/isSameOrAfter'
import utc from 'https://esm.sh/dayjs@1.11.10/plugin/utc'
import timezone from 'https://esm.sh/dayjs@1.11.10/plugin/timezone'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(utc)
dayjs.extend(timezone)

// Load environment variables for Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface Shift {
  id: string;
  guard_user_id: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  break_times?: Array<{ breakStart: string; breakEnd: string; breakType: string }>; // Example: [{ start: "12:00", end: "12:30", type: "paid" }]
  site_id?: string | null;
}

interface PayrollInput {
  guard_user_id: string;
  pay_period_start_date: string; // YYYY-MM-DD
  pay_period_end_date: string;   // YYYY-MM-DD
  hours_paid: number;
}

interface PayrollVariance {
  guard_user_id: string;
  shift_id?: string | null;
  variance_date: string; // YYYY-MM-DD
  scheduled_hours: number;
  actual_hours_calculated: number; // For this version, will be same as scheduled_hours
  paid_hours: number; // Needs to be allocated per day/shift from period total
  variance_hours: number;
  site_id?: string | null;
  notes?: string;
  status: 'Pending' | 'Investigating' | 'Resolved' | 'No Action Required';
}

// Helper to calculate shift duration in hours, considering breaks
function calculateScheduledHours(shift: Shift): number {
  const startDateTime = dayjs(`${shift.shift_date}T${shift.start_time}`);
  let endDateTime = dayjs(`${shift.shift_date}T${shift.end_time}`);

  // Handle overnight shifts for duration calculation
  if (endDateTime.isBefore(startDateTime)) {
    endDateTime = endDateTime.add(1, 'day');
  }

  const totalDurationMinutes = endDateTime.diff(startDateTime, 'minute');

  let unpaidBreakMinutes = 0;
  if (shift.break_times) {
    for (const breakPeriod of shift.break_times) {
      if (breakPeriod.breakType?.toLowerCase() !== 'paid') { // Assuming breaks might have a 'type'
        const breakStart = dayjs(`${shift.shift_date}T${breakPeriod.breakStart}`);
        let breakEnd = dayjs(`${shift.shift_date}T${breakPeriod.breakEnd}`);
        if (breakEnd.isBefore(breakStart)) { // Handle overnight breaks if necessary
          breakEnd = breakEnd.add(1, 'day');
        }
        unpaidBreakMinutes += breakEnd.diff(breakStart, 'minute');
      }
    }
  }

  const netDurationMinutes = totalDurationMinutes - unpaidBreakMinutes;
  return parseFloat((netDurationMinutes / 60).toFixed(2));
}


serve(async (_req: Request) => {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured.')
    }
    const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    })

    console.log("Starting calculate-payroll-variance function...")

    // Define the target pay period, e.g., the previous week ending last Sunday
    // This logic might need to be more sophisticated based on actual pay cycle.
    const today = dayjs().tz("Europe/London"); // Use a specific timezone
    const lastSunday = today.day() === 0 ? today : today.day(0); // If today is Sunday, use today, else last Sunday
    const payPeriodEndDate = lastSunday.subtract(1, 'day').format('YYYY-MM-DD'); // Saturday before last Sunday
    const payPeriodStartDate = dayjs(payPeriodEndDate).subtract(6, 'day').format('YYYY-MM-DD'); // 7 days prior

    console.log(`Processing payroll variance for period: ${payPeriodStartDate} to ${payPeriodEndDate}`);

    // 1. Fetch all shifts within this pay period
    const { data: shifts, error: shiftsError } = await adminSupabase
      .from('shifts')
      .select('*')
      .gte('shift_date', payPeriodStartDate)
      .lte('shift_date', payPeriodEndDate);

    if (shiftsError) throw shiftsError;
    if (!shifts || shifts.length === 0) {
      console.log('No shifts found for the target pay period.');
      return new Response(JSON.stringify({ message: 'No shifts in period.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    // 2. Fetch all payroll input data that overlaps with this period
    // This might fetch multiple payroll inputs if periods are not aligned; needs careful handling.
    // For simplicity, we assume payroll_input_data aligns or covers this calculated period.
    const { data: payrollInputs, error: payrollError } = await adminSupabase
      .from('payroll_input_data')
      .select('*')
      .lte('pay_period_start_date', payPeriodEndDate)
      .gte('pay_period_end_date', payPeriodStartDate);

    if (payrollError) throw payrollError;

    const payrollInputMap = new Map<string, PayrollInput>();
    if (payrollInputs) {
      for (const input of payrollInputs) {
        // Assuming one payroll input per guard for a period that includes our target.
        // More complex logic needed if a guard has multiple overlapping entries.
        payrollInputMap.set(input.guard_user_id, input);
      }
    }

    const variancesToInsert: PayrollVariance[] = [];

    // Group shifts by guard_user_id
    const shiftsByGuard = shifts.reduce((acc, shift) => {
      if (!acc[shift.guard_user_id]) acc[shift.guard_user_id] = [];
      acc[shift.guard_user_id].push(shift);
      return acc;
    }, {} as Record<string, Shift[]>);


    for (const guardId in shiftsByGuard) {
      const guardShifts = shiftsByGuard[guardId];
      const guardPayrollInput = payrollInputMap.get(guardId);

      let totalScheduledHoursForPeriod = 0;
      guardShifts.forEach(shift => {
        totalScheduledHoursForPeriod += calculateScheduledHours(shift);
      });
      totalScheduledHoursForPeriod = parseFloat(totalScheduledHoursForPeriod.toFixed(2));

      // For this version, actual_hours_calculated = scheduled_hours
      const totalActualHoursCalculatedForPeriod = totalScheduledHoursForPeriod;

      const paidHoursForPeriod = guardPayrollInput ? guardPayrollInput.hours_paid : 0;

      // Distribute paid hours across shifts pro-rata if needed for per-shift variance,
      // or calculate overall variance for the guard for the period.
      // For now, let's create a single variance record per guard for the period if there's a discrepancy.
      // A more granular per-shift variance would require matching daily paid hours.

      if (Math.abs(totalActualHoursCalculatedForPeriod - paidHoursForPeriod) > 0.01) { // Check for any difference
        // Create a single variance entry for the guard for the entire period for simplicity.
        // variance_date could be the end of the period or the first day a variance was noted.
        variancesToInsert.push({
          guard_user_id: guardId,
          // shift_id: null, // Not tied to a single shift in this simplified model
          variance_date: payPeriodEndDate, // Use period end date for the variance record
          scheduled_hours: totalScheduledHoursForPeriod,
          actual_hours_calculated: totalActualHoursCalculatedForPeriod,
          paid_hours: paidHoursForPeriod, // This is the total paid for the guard's pay period
          variance_hours: parseFloat((totalActualHoursCalculatedForPeriod - paidHoursForPeriod).toFixed(2)),
          site_id: guardShifts[0]?.site_id || null, // Take site_id from first shift as an example
          notes: `Variance for pay period ${payPeriodStartDate} to ${payPeriodEndDate}. Scheduled/Calculated: ${totalActualHoursCalculatedForPeriod}hrs, Paid: ${paidHoursForPeriod}hrs.`,
          status: 'Pending',
        });
      }
    }

    if (variancesToInsert.length > 0) {
      // Before inserting, one might delete old 'Pending' variances for this period and guard_ids
      // to avoid clutter, or handle updates on the client-side dashboard.
      // For this version, we'll insert new ones. Duplicates might occur if run multiple times for same period without clearing.
      // A unique constraint on (guard_user_id, variance_date, type_of_variance_key) could prevent this.
      // For now, we assume the dashboard will show latest or allow management.

      console.log(`Inserting ${variancesToInsert.length} new payroll variances...`);
      const { error: insertError } = await adminSupabase
        .from('payroll_variances')
        .insert(variancesToInsert);

      if (insertError) {
        console.error('Error inserting payroll variances:', insertError);
        throw insertError;
      }
      console.log(`${variancesToInsert.length} payroll variances inserted.`);
    } else {
      console.log('No payroll variances identified for this period.');
    }

    return new Response(
      JSON.stringify({ message: `Payroll variance check completed. ${variancesToInsert.length} variances generated.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in calculate-payroll-variance function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
