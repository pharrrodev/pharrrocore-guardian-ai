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
// Run the script from the project root using: node scripts/seedShifts.js

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

// --- Data Definitions ---
const POSITIONS = ["Main Gate", "Reception", "Patrol Route A", "Patrol Route B", "CCTV Room", "Loading Bay"];
const SHIFT_TYPES_DETAILS = {
  Day: { start: '07:00', end: '15:00', breaks: [{ breakStart: '12:00', breakEnd: '12:30', breakType: 'Lunch' }] },
  Evening: { start: '15:00', end: '23:00', breaks: [{ breakStart: '18:00', breakEnd: '18:30', breakType: 'Dinner' }] },
  Night: { start: '23:00', end: '07:00', breaks: [{ breakStart: '03:00', breakEnd: '03:30', breakType: 'Rest' }] }, // End time is next day
};
const DUMMY_SITE_ID = '00000000-0000-0000-0000-000000000001'; // Example Site ID
const NUMBER_OF_SHIFTS_TO_GENERATE = 75; // Target 50-100
const DATE_RANGE_DAYS = 14; // Generate shifts for today +/- DATE_RANGE_DAYS

async function fetchGuardUsers() {
  console.log("Fetching guard users from 'profiles' table...");
  const { data: guards, error } = await supabaseAdmin
    .from('profiles')
    .select('id, guard_name') // 'id' here is auth.users.id
    .eq('role', 'guard');

  if (error) {
    console.error("Error fetching guards:", error.message);
    throw error;
  }
  if (!guards || guards.length === 0) {
    throw new Error("No guards found with role 'guard' in profiles table. Please run seedUsers.js first.");
  }
  console.log(`Found ${guards.length} guard users.`);
  return guards.map(g => ({ id: g.id, name: g.guard_name }));
}

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedShifts() {
  console.log("Starting shifts seeding process...");
  let guardUsers;
  try {
    guardUsers = await fetchGuardUsers();
  } catch (error) {
    console.error("Could not proceed without guard users. Exiting.");
    return;
  }

  const generatedShifts = [];
  const today = dayjs();

  for (let i = 0; i < NUMBER_OF_SHIFTS_TO_GENERATE; i++) {
    const randomGuard = getRandomElement(guardUsers);
    if (!randomGuard) {
      console.warn("Skipping shift generation due to no available guards.");
      continue;
    }

    const dateOffset = Math.floor(Math.random() * (DATE_RANGE_DAYS * 2 + 1)) - DATE_RANGE_DAYS; // +/- DATE_RANGE_DAYS
    const shiftDate = today.add(dateOffset, 'day');

    const shiftTypeName = getRandomElement(Object.keys(SHIFT_TYPES_DETAILS));
    const shiftTypeDetails = SHIFT_TYPES_DETAILS[shiftTypeName];

    // Handle night shifts crossing midnight for shift_date
    // If a night shift starts at 23:00, its 'shift_date' is the day it starts.
    // The end_time '07:00' implicitly means the next day.

    const shift = {
      id: crypto.randomUUID(),
      guard_id: randomGuard.id,
      guard_name: randomGuard.name,
      shift_date: shiftDate.format('YYYY-MM-DD'),
      start_time: shiftTypeDetails.start,
      end_time: shiftTypeDetails.end,
      position: getRandomElement(POSITIONS),
      shift_type: shiftTypeName,
      break_times: shiftTypeDetails.breaks,
      site_id: DUMMY_SITE_ID,
      // created_at and updated_at will be set by Supabase
    };
    generatedShifts.push(shift);
  }

  if (generatedShifts.length === 0) {
    console.log("No shifts were generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedShifts.length} shift records locally.`);

  // Deletion strategy: Delete shifts for the involved guards within the generated date range
  const involvedGuardIds = [...new Set(generatedShifts.map(s => s.guard_id))];
  const minDate = today.subtract(DATE_RANGE_DAYS, 'day').format('YYYY-MM-DD');
  const maxDate = today.add(DATE_RANGE_DAYS, 'day').format('YYYY-MM-DD');

  console.log(`Deleting existing shifts for ${involvedGuardIds.length} guards between ${minDate} and ${maxDate}...`);
  try {
    const { error: deleteError } = await supabaseAdmin
      .from('shifts')
      .delete()
      .in('guard_id', involvedGuardIds)
      .gte('shift_date', minDate)
      .lte('shift_date', maxDate);

    if (deleteError) {
      console.error("Error deleting existing shifts:", deleteError.message);
      // Decide if you want to proceed or stop. For seeding, often we want to proceed.
      // throw deleteError;
    } else {
      console.log("Successfully deleted potentially overlapping existing shifts for selected guards and date range.");
    }
  } catch (error) {
     console.error("Unexpected error during deletion phase:", error);
  }


  // Insert the new batch
  console.log(`Inserting ${generatedShifts.length} new shift records into Supabase...`);
  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('shifts')
      .insert(generatedShifts)
      .select();

    if (insertError) {
      console.error('Error inserting new shifts:', insertError.message);
      // Check for unique constraint violation details if possible
      if (insertError.code === '23505') { // PostgreSQL unique violation
        console.error("Details:", insertError.details);
        console.error("Hint:", insertError.hint);
      }
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new shift records.`);
    if (data && data.length < generatedShifts.length) {
        console.warn(`Some shifts may not have been inserted. Prepared: ${generatedShifts.length}, Inserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed shifts:', error);
  } finally {
    console.log("Shifts seeding process complete.");
  }
}

seedShifts().catch(error => {
  console.error("Unhandled error in seedShifts:", error);
});
