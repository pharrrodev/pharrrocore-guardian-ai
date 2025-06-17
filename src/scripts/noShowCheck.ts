
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient'; // Assuming supabase client is configured

// Define types based on expected Supabase table structures
interface RotaEntry {
  id: string; // This is shift_id
  guard_id: string;
  date: string; // 'YYYY-MM-DD'
  start_time: string; // 'HH:MM'
  site_id: string | null;
  // Add other relevant fields from your 'rota' table, e.g., status
  // status?: string; // e.g., 'Confirmed', 'Pending Confirmation'
}

interface ShiftActivity {
  guard_id: string;
  activity_type: string;
  "timestamp": string; // ISO string
  shift_id: string;
}

interface ExistingNoShowAlert {
  guard_id: string;
  expected_shift_start_time: string; // ISO string for the specific shift instance
  shift_id: string; // To uniquely identify the shift instance
}

// Get grace period from environment or default to 10 minutes
// For a backend script, use process.env.GRACE_PERIOD_MINUTES
const GRACE_PERIOD_MINUTES = parseInt(process.env.GRACE_PERIOD_MINUTES || '10');

export const checkNoShows = async (): Promise<void> => {
  console.log('=== Starting No-Show Check ===');
  const now = dayjs();
  const newAlertsToInsert: any[] = [];

  // 1. Fetch upcoming/recent shifts from Supabase 'rota' table
  //    Adjust filters as needed (e.g., shifts starting in the last X hours and next Y hours)
  //    For this example, we'll look for shifts that should have started recently.
  const relevantPeriodStart = now.subtract(2, 'hour').toISOString();
  const relevantPeriodEnd = now.add(GRACE_PERIOD_MINUTES + 5, 'minute').toISOString(); // Shifts that should be starting or just started

  console.log(`Fetching rota shifts between ${relevantPeriodStart} and ${relevantPeriodEnd}`);
  const { data: rotaShifts, error: rotaError } = await supabase
    .from('rota') // Assuming your rota table is named 'rota'
    .select('id, guard_id, date, start_time, site_id, status') // Adjust columns as needed
    // .eq('status', 'Confirmed') // Optionally, only check confirmed shifts
    .gte('date', now.subtract(1, 'day').format('YYYY-MM-DD')) // Optimization: limit date range
    .lte('date', now.format('YYYY-MM-DD'));
    // Further filtering by combining date and start_time to form a full timestamp
    // might be needed if 'start_time' doesn't make 'date' redundant for this comparison window.

  if (rotaError) {
    console.error('Error fetching rota data:', rotaError);
    return;
  }
  if (!rotaShifts || rotaShifts.length === 0) {
    console.log('No relevant rota shifts found.');
    return;
  }
  console.log(`Found ${rotaShifts.length} potentially relevant rota shifts.`);

  // Filter shifts more precisely based on their actual start datetime
  const shiftsToCheck = rotaShifts.filter(shift => {
    const shiftDateTime = dayjs(`${shift.date}T${shift.start_time}`); // Ensure this parsing is correct for your time format
    return shiftDateTime.isAfter(now.subtract(2, 'hour')) && shiftDateTime.isBefore(now.add(GRACE_PERIOD_MINUTES + 5, 'minute'));
  });

  if (shiftsToCheck.length === 0) {
    console.log('No shifts fall into the precise check window.');
    return;
  }
  console.log(`Processing ${shiftsToCheck.length} shifts in the precise check window.`);


  // 2. Fetch recent shift start activities from `shift_activities`
  const activityCheckStartTime = now.subtract(3, 'hour').toISOString(); // Check activities in a wider window
  const { data: shiftActivities, error: activityError } = await supabase
    .from('shift_activities')
    .select('guard_id, activity_type, timestamp, shift_id')
    .in('activity_type', ['Shift Confirmed', 'Shift Start', 'Check Call']) // Relevant activities
    .gte('timestamp', activityCheckStartTime);

  if (activityError) {
    console.error('Error fetching shift activities:', activityError);
    return;
  }
  const activitiesMap = new Map<string, ShiftActivity[]>();
  (shiftActivities || []).forEach(act => {
    const key = `${act.guard_id}-${act.shift_id}`; // Or just guard_id if shift_id is not always present/reliable
    if (!activitiesMap.has(key)) activitiesMap.set(key, []);
    activitiesMap.get(key)!.push(act);
  });


  // 3. Fetch existing no-show alerts for relevant shifts to avoid duplicates
  const alertCheckStartTime = now.subtract(3, 'hour').toISOString(); // Check alerts in a wider window
  const { data: existingAlertsData, error: existingAlertsError } = await supabase
    .from('no_show_alerts')
    .select('guard_id, shift_id, expected_shift_start_time')
    .gte('expected_shift_start_time', alertCheckStartTime);
  
  if (existingAlertsError) {
    console.error('Error fetching existing no-show alerts:', existingAlertsError);
    return;
  }
  const existingAlertsSet = new Set(
    (existingAlertsData || []).map(a => `${a.guard_id}-${a.shift_id}`) // Use shift_id for uniqueness
  );


  // 4. Logic to determine no-shows
  for (const shift of shiftsToCheck) {
    const shiftDateTime = dayjs(`${shift.date}T${shift.start_time}`); // Ensure TZ consistency if applicable
    const gracePeriodEnd = shiftDateTime.add(GRACE_PERIOD_MINUTES, 'minute');

    console.log(`Checking shift: Guard ${shift.guard_id}, Shift ID ${shift.id}, Expected Start: ${shiftDateTime.format()}`);
    console.log(`Grace period ends: ${gracePeriodEnd.format()}, Current time: ${now.format()}`);

    if (now.isAfter(gracePeriodEnd)) { // Check only if grace period has passed
      const alertKey = `${shift.guard_id}-${shift.id}`;
      if (existingAlertsSet.has(alertKey)) {
        console.log(`Alert already exists for Guard ${shift.guard_id}, Shift ID ${shift.id}. Skipping.`);
        continue;
      }

      const guardActivitiesKey = `${shift.guard_id}-${shift.id}`; // Key to look up activities
      const guardRecentActivities = activitiesMap.get(guardActivitiesKey) || [];
      
      const hasCheckedIn = guardRecentActivities.some(activity => {
        const activityTime = dayjs(activity.timestamp);
        // Check if activity is within a window around shift start (e.g. 30 mins before to grace period end)
        return activityTime.isAfter(shiftDateTime.subtract(30, 'minute')) &&
               activityTime.isBefore(gracePeriodEnd);
      });

      if (!hasCheckedIn) {
        console.log(`🚨 NO-SHOW DETECTED: Guard ${shift.guard_id} for Shift ID ${shift.id} (Expected: ${shiftDateTime.format()})`);
        newAlertsToInsert.push({
          guard_id: shift.guard_id,
          expected_shift_start_time: shiftDateTime.toISOString(),
          alert_time: now.toISOString(),
          shift_id: shift.id, // This is rota.id
          site_id: shift.site_id,
          status: 'Pending',
        });
        existingAlertsSet.add(alertKey); // Add to set to prevent duplicate alerts in this run
      } else {
        console.log(`Guard ${shift.guard_id} for Shift ID ${shift.id} seems to have checked in.`);
      }
    } else {
      console.log(`Shift for Guard ${shift.guard_id}, Shift ID ${shift.id} is not yet past grace period.`);
    }
  }

  // 5. Insert new alerts into Supabase `no_show_alerts` table
  if (newAlertsToInsert.length > 0) {
    console.log(`Inserting ${newAlertsToInsert.length} new no-show alerts into Supabase...`);
    const { error: insertError } = await supabase
      .from('no_show_alerts')
      .insert(newAlertsToInsert);

    if (insertError) {
      console.error('Error inserting no-show alerts:', insertError);
    } else {
      console.log(`${newAlertsToInsert.length} new no-show alerts inserted successfully.`);
    }
  } else {
    console.log('No new no-show alerts to insert.');
  }

  console.log('=== No-Show Check Complete ===');
};

// Example of how this might be run (e.g. in a cron job)
// (async () => {
//   // Ensure Supabase client is initialized, potentially with service key
//   // if (!supabase.auth.session()) {
//   //   // Initialize with service key if needed, or ensure environment variables are set for client
//   //   console.log("Supabase client needs to be initialized, possibly with a service role for backend scripts.");
//   //   // Example: global.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
//   // }
//   if (supabase) { // Check if supabase client is available
//      await checkNoShows();
//   } else {
//      console.error("Supabase client not initialized. Cannot run noShowCheck.");
//   }
// })();


// Old localStorage functions - to be removed or adapted if some client-side display remains for a bit
// export const getNoShowAlerts = (): NoShowAlert[] => { ... };
// export const saveNoShowAlerts = (newAlerts: NoShowAlert[]): void => { ... };
// export const getAlertsLast24Hours = (): NoShowAlert[] => { ... };
