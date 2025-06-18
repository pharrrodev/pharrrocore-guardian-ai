// This script is designed to be run in a Node.js environment.
// Ensure you have `dotenv`, `@supabase/supabase-js`, and `dayjs` installed:
// npm install dotenv @supabase/supabase-js dayjs
// or
// yarn add dotenv @supabase/supabase-js dayjs
//
// Create a .env file in the project root with your Supabase URL and Service Role Key:
// SUPABASE_URL=your_supabase_url
// SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
//
// Run the script from the project root using: node scripts/seedShiftActivities.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const crypto = require('crypto'); // For UUID generation

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log("Supabase admin client initialized.");

// Date range for fetching shifts (should match or be within the range used in seedShifts.js)
const DATE_RANGE_DAYS = 14;
const today = dayjs();
const minShiftDate = today.subtract(DATE_RANGE_DAYS, 'day').format('YYYY-MM-DD');
const maxShiftDate = today.add(DATE_RANGE_DAYS, 'day').format('YYYY-MM-DD');

// --- Helper function to shuffle an array ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

async function seedShiftActivities() {
  console.log("Starting shift activities seeding process...");

  // 1. Fetch existing shifts to add activities for
  console.log(`Fetching shifts between ${minShiftDate} and ${maxShiftDate}...`);
  let { data: shifts, error: shiftsError } = await supabaseAdmin
    .from('shifts')
    .select('id, guard_id, shift_date, start_time') // Select necessary fields
    .gte('shift_date', minShiftDate)
    .lte('shift_date', maxShiftDate);

  if (shiftsError) {
    console.error("Error fetching shifts:", shiftsError.message);
    throw shiftsError;
  }
  if (!shifts || shifts.length === 0) {
    console.log("No shifts found in the specified date range to add activities to. Ensure seedShifts.js has been run.");
    return;
  }
  console.log(`Found ${shifts.length} shifts.`);

  // Shuffle shifts to randomize which ones get confirmed/declined
  shifts = shuffleArray(shifts);

  const activitiesToInsert = [];
  const shiftIdsProcessed = new Set();

  // 2. Generate 'Shift Confirmed' activities (approx 50%)
  const numToConfirm = Math.floor(shifts.length * 0.5);
  console.log(`Attempting to generate 'Shift Confirmed' for ${numToConfirm} shifts...`);
  for (let i = 0; i < numToConfirm; i++) {
    const shift = shifts[i];
    if (!shift) continue;

    // Timestamp: 1-3 days before shift_date, random hour/minute
    const confirmationTimestamp = dayjs(shift.shift_date + 'T' + shift.start_time)
      .subtract(Math.floor(Math.random() * 3) + 1, 'day')
      .hour(Math.floor(Math.random() * 12) + 8) // Between 8 AM and 8 PM
      .minute(Math.floor(Math.random() * 60))
      .toISOString();

    activitiesToInsert.push({
      id: crypto.randomUUID(),
      shift_id: shift.id,
      guard_id: shift.guard_id,
      activity_type: 'Shift Confirmed',
      timestamp: confirmationTimestamp,
      notes: 'Confirmed via automated seeding script.'
    });
    shiftIdsProcessed.add(shift.id);
  }

  // 3. Generate 'Shift Declined' activities (approx 10%)
  const numToDecline = Math.floor(shifts.length * 0.1);
  let declineCount = 0;
  console.log(`Attempting to generate 'Shift Declined' for ${numToDecline} shifts...`);
  for (let i = numToConfirm; i < shifts.length && declineCount < numToDecline; i++) {
    const shift = shifts[i];
    if (!shift || shiftIdsProcessed.has(shift.id)) continue; // Skip if already processed (e.g. confirmed)

     // Timestamp: Similar logic to confirmed, but perhaps closer to shift date
    const declineTimestamp = dayjs(shift.shift_date + 'T' + shift.start_time)
      .subtract(Math.floor(Math.random() * 2) + 1, 'day') // 1-2 days before
      .hour(Math.floor(Math.random() * 10) + 9) // Between 9 AM and 7 PM
      .minute(Math.floor(Math.random() * 60))
      .toISOString();

    activitiesToInsert.push({
      id: crypto.randomUUID(),
      shift_id: shift.id,
      guard_id: shift.guard_id,
      activity_type: 'Shift Declined',
      timestamp: declineTimestamp,
      notes: 'Declined (automated seeding).'
    });
    shiftIdsProcessed.add(shift.id);
    declineCount++;
  }

  if (activitiesToInsert.length === 0) {
    console.log("No new activities generated. Exiting.");
    return;
  }
  console.log(`Generated ${activitiesToInsert.length} activity records locally.`);

  // 4. Deletion strategy: Delete existing 'Shift Confirmed'/'Declined' for the processed shift IDs
  const allProcessedShiftIds = Array.from(shiftIdsProcessed);
  if (allProcessedShiftIds.length > 0) {
    console.log(`Deleting existing 'Shift Confirmed'/'Declined' activities for ${allProcessedShiftIds.length} processed shifts...`);
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('shift_activities')
        .delete()
        .in('shift_id', allProcessedShiftIds)
        .in('activity_type', ['Shift Confirmed', 'Shift Declined']);

      if (deleteError) {
        console.error("Error deleting existing activities:", deleteError.message);
        // Decide if to proceed. For seeding, often we proceed.
      } else {
        console.log("Successfully deleted potentially overlapping existing activities.");
      }
    } catch (error) {
      console.error("Unexpected error during activity deletion phase:", error);
    }
  }

  // 5. Insert the new batch of activities
  console.log(`Inserting ${activitiesToInsert.length} new activity records into Supabase...`);
  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('shift_activities')
      .insert(activitiesToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting new shift activities:', insertError.message);
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new shift activity records.`);
    if (data && data.length < activitiesToInsert.length) {
        console.warn(`Some activities may not have been inserted. Prepared: ${activitiesToInsert.length}, Inserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed shift activities:', error);
  } finally {
    console.log("Shift activities seeding process complete.");
  }
}

seedShiftActivities().catch(error => {
  console.error("Unhandled error in seedShiftActivities:", error);
});
