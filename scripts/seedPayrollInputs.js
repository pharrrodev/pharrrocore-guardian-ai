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
// Run the script from the project root using: node scripts/seedPayrollInputs.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const isoWeek = require('dayjs/plugin/isoWeek');

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);


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
const NUMBER_OF_GUARDS_TO_PROCESS = 10; // Process for the first 10 guards fetched
const NUMBER_OF_WEEKS_TO_SEED = 3; // Seed data for the last 3 full weeks

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Function to get weekly pay periods (Monday to Sunday)
function getRecentWeeklyPayPeriods(numberOfWeeks) {
  const periods = [];
  let currentEndDate = dayjs().isoWeekday(0); // Last Sunday (end of week)
  if (dayjs().isoWeekday() === 0) { // If today is Sunday, use it as current period end.
    currentEndDate = dayjs();
  } else { // Otherwise, use last Sunday.
    currentEndDate = dayjs().subtract(1, 'week').isoWeekday(7); // Last Sunday
  }


  for (let i = 0; i < numberOfWeeks; i++) {
    const endDate = currentEndDate.subtract(i * 7, 'days');
    const startDate = endDate.subtract(6, 'days');
    periods.push({
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD'),
      weekNumber: startDate.isoWeek()
    });
  }
  return periods.reverse(); // Start with the oldest week
}


async function fetchUsers(roles, limit) {
  console.log(`Fetching up to ${limit} users with roles: ${roles.join(', ')}...`);
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id, guard_name') // 'id' here is auth.users.id
    .in('role', roles)
    .limit(limit);

  if (error) {
    console.error(`Error fetching users with roles ${roles.join(', ')}:`, error.message);
    throw error;
  }
  if (!users || users.length === 0) {
    throw new Error(`No users found with roles ${roles.join(', ')} in profiles table. Please run seedUsers.js first.`);
  }
  console.log(`Found ${users.length} users for roles: ${roles.join(', ')}.`);
  return users.map(u => ({ id: u.id, name: u.guard_name }));
}

async function seedPayrollInputs() {
  console.log("Starting Payroll Input Data seeding process...");
  let guardUsers, adminUsers;
  try {
    guardUsers = await fetchUsers(['guard'], NUMBER_OF_GUARDS_TO_PROCESS);
    adminUsers = await fetchUsers(['supervisor', 'admin'], 5); // Fetch a few admins/supervisors
    if (adminUsers.length === 0) {
        console.warn("No supervisors/admins found, using first guard as data inputter as a fallback.");
        if (guardUsers.length === 0) throw new Error("No guards available to act as inputters either.");
        adminUsers = [guardUsers[0]];
    }
  } catch (error) {
    console.error("Could not proceed without users. Exiting.", error.message);
    return;
  }

  const payPeriods = getRecentWeeklyPayPeriods(NUMBER_OF_WEEKS_TO_SEED);
  const generatedPayrollInputs = [];

  for (const period of payPeriods) {
    for (const guard of guardUsers) {
      // Simulate varied paid hours
      let hoursPaid;
      const rand = Math.random();
      if (rand < 0.1) { // 10% chance of slight underpayment
        hoursPaid = parseFloat((35 + Math.random() * 4).toFixed(2)); // e.g., 35-39 hours
      } else if (rand < 0.2) { // 10% chance of slight overpayment
        hoursPaid = parseFloat((40.1 + Math.random() * 4).toFixed(2)); // e.g., 40.1-44.1 hours
      } else { // 80% chance of standard hours
        hoursPaid = parseFloat((38.5 + Math.random() * 3).toFixed(2)); // e.g., 38.5-41.5 hours
      }

      const randomAdmin = getRandomElement(adminUsers);

      generatedPayrollInputs.push({
        guard_user_id: guard.id,
        pay_period_start_date: period.start,
        pay_period_end_date: period.end,
        hours_paid: hoursPaid,
        source_reference: `DummyData-W${period.weekNumber}-${dayjs(period.start).year()}`,
        input_by_user_id: randomAdmin.id,
      });
    }
  }

  if (generatedPayrollInputs.length === 0) {
    console.log("No payroll input data was generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedPayrollInputs.length} payroll input records locally.`);

  // Upsert the new batch
  console.log(`Upserting ${generatedPayrollInputs.length} payroll input records into Supabase...`);
  try {
    const { data, error: upsertError } = await supabaseAdmin
      .from('payroll_input_data')
      .upsert(generatedPayrollInputs, {
        onConflict: 'guard_user_id,pay_period_start_date,pay_period_end_date',
        // ignoreDuplicates: false // default is true, which is fine for upsert. explicit for clarity.
      })
      .select();

    if (upsertError) {
      console.error('Error upserting payroll input data:', upsertError.message);
      throw upsertError;
    }

    console.log(`Successfully upserted ${data ? data.length : 0} payroll input records.`);
    if (data && data.length < generatedPayrollInputs.length) {
        console.warn(`Some records may not have been upserted if there were issues beyond onConflict resolution. Prepared: ${generatedPayrollInputs.length}, Upserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed payroll input data:', error);
  } finally {
    console.log("Payroll input data seeding process complete.");
  }
}

seedPayrollInputs().catch(error => {
  console.error("Unhandled error in seedPayrollInputs:", error);
});
