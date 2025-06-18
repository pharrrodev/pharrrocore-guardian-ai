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
// Run the script from the project root using: node scripts/seedBreakCheckQueries.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

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

const NUMBER_OF_QUERIES_TO_GENERATE = 20; // Target 15-20
const DATE_RANGE_DAYS_FOR_SHIFTS = 7; // Fetch shifts from today +/- this range

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Simplified helper to check if a time is within a break period
// Times are in HH:mm format
function determineBreakStatus(currentTimeHHmm, breaks) {
  if (!breaks || breaks.length === 0) {
    return { onBreak: false, message: "No breaks scheduled for this shift." };
  }

  const currentMoment = dayjs(`2000-01-01T${currentTimeHHmm}`); // Use a dummy date for time comparison

  for (const breakPeriod of breaks) {
    const breakStartMoment = dayjs(`2000-01-01T${breakPeriod.breakStart}`);
    let breakEndMoment = dayjs(`2000-01-01T${breakPeriod.breakEnd}`);

    // Handle breaks crossing midnight if necessary, though less common for short breaks
    if (breakEndMoment.isBefore(breakStartMoment)) {
      // This logic might need adjustment if breaks can span past midnight from shift start
      // For simplicity, assuming breaks are within the same logical day as their start time
    }

    if (currentMoment.isSame(breakStartMoment) || currentMoment.isAfter(breakStartMoment) && currentMoment.isBefore(breakEndMoment)) {
      return { onBreak: true, message: `Currently on ${breakPeriod.breakType || 'break'} (until ${breakPeriod.breakEnd}).` };
    }
  }

  // Find next break
   const futureBreaks = breaks
    .filter(b => dayjs(`2000-01-01T${b.breakStart}`).isAfter(currentMoment))
    .sort((a,b) => a.breakStart.localeCompare(b.breakStart));

  if (futureBreaks.length > 0) {
    const nextBreak = futureBreaks[0];
    return { onBreak: false, message: `Next break: ${nextBreak.breakType || 'Break'} from ${nextBreak.breakStart} to ${nextBreak.breakEnd}.`};
  }

  return { onBreak: false, message: "Not currently on break. No further breaks scheduled for this shift." };
}


async function fetchUsersForChecks() {
  console.log("Fetching users (guards/supervisors) from 'profiles' table...");
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id') // 'id' here is auth.users.id
    .in('role', ['guard', 'supervisor', 'admin']);

  if (error) {
    console.error("Error fetching users:", error.message);
    throw error;
  }
  if (!users || users.length === 0) {
    throw new Error("No users found in profiles table. Please run seedUsers.js first.");
  }
  console.log(`Found ${users.length} users who can perform checks.`);
  return users.map(u => u.id); // Return array of UUIDs
}

async function fetchSampleShifts() {
  console.log("Fetching sample shifts...");
  const today = dayjs();
  const minShiftDate = today.subtract(DATE_RANGE_DAYS_FOR_SHIFTS, 'day').format('YYYY-MM-DD');
  const maxShiftDate = today.add(DATE_RANGE_DAYS_FOR_SHIFTS, 'day').format('YYYY-MM-DD');

  const { data: shifts, error } = await supabaseAdmin
    .from('shifts')
    .select('id, guard_id, guard_name, shift_date, start_time, end_time, break_times, site_id')
    .gte('shift_date', minShiftDate)
    .lte('shift_date', maxShiftDate)
    .limit(50); // Fetch a decent sample size

  if (error) {
    console.error("Error fetching shifts:", error.message);
    throw error;
  }
  if (!shifts || shifts.length === 0) {
    throw new Error("No shifts found in the specified date range. Ensure seedShifts.js has been run.");
  }
  console.log(`Found ${shifts.length} sample shifts.`);
  return shifts;
}


async function seedBreakCheckQueries() {
  console.log("Starting Break Check Queries seeding process...");
  let usersPerformingCheck, sampleShifts;
  try {
    usersPerformingCheck = await fetchUsersForChecks();
    sampleShifts = await fetchSampleShifts();
  } catch (error) {
    console.error("Could not proceed due to error fetching prerequisites. Exiting.", error.message);
    return;
  }

  const generatedQueries = [];

  for (let i = 0; i < NUMBER_OF_QUERIES_TO_GENERATE; i++) {
    const randomShift = getRandomElement(sampleShifts);
    if (!randomShift) continue;

    const userChecking = getRandomElement(usersPerformingCheck);
    if (!userChecking) continue;

    // Generate a random time within the shift duration
    const shiftStartMoment = dayjs(`${randomShift.shift_date}T${randomShift.start_time}`);
    let shiftEndMoment = dayjs(`${randomShift.shift_date}T${randomShift.end_time}`);
    if (shiftEndMoment.isBefore(shiftStartMoment)) { // Handles overnight shifts
      shiftEndMoment = shiftEndMoment.add(1, 'day');
    }
    const shiftDurationMinutes = shiftEndMoment.diff(shiftStartMoment, 'minute');
    const randomMinutesIntoShift = Math.floor(Math.random() * shiftDurationMinutes);
    const queriedTimeMoment = shiftStartMoment.add(randomMinutesIntoShift, 'minute');

    const queriedTimeHHmm = queriedTimeMoment.format('HH:mm');
    // The query_timestamp should be when the check was made, can be slightly different from queried_time
    // For simplicity, let's make it very close to or same as queriedTimeMoment for seeding
    const queryTimestampISO = queriedTimeMoment.subtract(Math.floor(Math.random()*5), 'minute').toISOString();


    const breakStatusResult = determineBreakStatus(queriedTimeHHmm, randomShift.break_times || []);

    const queryEntry = {
      queried_guard_user_id: randomShift.guard_id,
      queried_guard_name: randomShift.guard_name,
      queried_date: randomShift.shift_date, // This is already YYYY-MM-DD
      queried_time: queriedTimeHHmm, // HH:mm
      status_on_break: breakStatusResult.onBreak,
      status_message: breakStatusResult.message,
      shift_id_checked: randomShift.id,
      user_id_performing_check: userChecking,
      query_timestamp: queryTimestampISO,
      site_id: randomShift.site_id || null,
    };
    generatedQueries.push(queryEntry);
  }

  if (generatedQueries.length === 0) {
    console.log("No break check queries were generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedQueries.length} break check query records locally.`);

  console.log(`Inserting ${generatedQueries.length} new break check query records into Supabase...`);
  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('break_check_queries')
      .insert(generatedQueries)
      .select();

    if (insertError) {
      console.error('Error inserting new break check queries:', insertError.message);
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new break check query records.`);
  } catch (error) {
    console.error('Failed to seed break check queries:', error);
  } finally {
    console.log("Break Check Queries seeding process complete.");
  }
}

seedBreakCheckQueries().catch(error => {
  console.error("Unhandled error in seedBreakCheckQueries:", error);
});
