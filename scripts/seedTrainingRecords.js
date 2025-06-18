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
// Run the script from the project root using: node scripts/seedTrainingRecords.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const crypto = require('crypto'); // Not needed for PK if DB generates it.

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
const SAMPLE_COURSES = [
  { name: "First Aid Level 3", validityYears: 3 },
  { name: "Fire Warden Training", validityYears: 2 },
  { name: "Conflict Management", validityYears: 1 },
  { name: "SIA Door Supervisor Upskilling", validityYears: 3 },
  { name: "CCTV Operator (Public Space Surveillance)", validityYears: 3 },
  { name: "Mental Health First Aid", validityYears: 2 },
  { name: "Advanced Driving Course", validityYears: 5 },
  { name: "Security Screening Procedures", validityYears: 1 },
  { name: "ACT Awareness eLearning", validityYears: 1 },
  { name: "Manual Handling Training", validityYears: 3 }
];

const CERTIFICATE_PLACEHOLDERS = [null, null, null, "https://example.com/certs/placeholder.pdf", null];
const DUMMY_SITE_ID = '00000000-0000-0000-0000-000000000001'; // Example Site ID, if table schema has it
const NUMBER_OF_RECORDS_TO_GENERATE = 40; // Target 30-50

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchUsers(roles) {
  console.log(`Fetching users with roles: ${roles.join(', ')}...`);
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id, guard_name') // 'id' here is auth.users.id
    .in('role', roles);

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

async function seedTrainingRecords() {
  console.log("Starting Training Records seeding process...");
  let guardUsers, adderUsers;
  try {
    guardUsers = await fetchUsers(['guard']);
    adderUsers = await fetchUsers(['supervisor', 'admin']);
    if (adderUsers.length === 0) {
        console.warn("No supervisors/admins found, using guards as record adders as a fallback.");
        adderUsers = guardUsers;
         if (adderUsers.length === 0) throw new Error("No guards available to act as adders either.");
    }
  } catch (error) {
    console.error("Could not proceed without users. Exiting.");
    return;
  }

  const generatedRecords = [];
  const today = dayjs();
  // Using a Set to ensure (guard_name_recorded, course_name, expiry_date) is unique for this batch
  const uniqueConstraintCheck = new Set();

  while (generatedRecords.length < NUMBER_OF_RECORDS_TO_GENERATE) {
    const randomGuard = getRandomElement(guardUsers);
    const randomAdder = getRandomElement(adderUsers);
    if (!randomGuard || !randomAdder) {
        console.warn("Skipping record generation due to missing guard or adder.");
        continue;
    }

    const course = getRandomElement(SAMPLE_COURSES);

    // Completed Date: Randomly within the last 3 years
    const completedDate = today.subtract(Math.floor(Math.random() * 365 * 3), 'day');

    let expiryDate = completedDate.add(course.validityYears, 'year');

    // Adjust some expiry dates for variety
    const randomFactor = Math.random();
    if (randomFactor < 0.15) { // ~15% expired
      expiryDate = today.subtract(Math.floor(Math.random() * 180) + 30, 'day'); // Expired 1-6 months ago
    } else if (randomFactor < 0.40) { // ~25% expiring soon (next 60 days)
      expiryDate = today.add(Math.floor(Math.random() * 60) + 1, 'day');
    }
    // Else, use calculated expiry date (valid for longer)

    const formattedCompletedDate = completedDate.format('YYYY-MM-DD');
    const formattedExpiryDate = expiryDate.format('YYYY-MM-DD');

    const uniqueKey = `${randomGuard.name}-${course.name}-${formattedExpiryDate}`;
    if (uniqueConstraintCheck.has(uniqueKey)) {
      // console.log(`Skipping duplicate (guard_name, course, expiry) combination for this run: ${uniqueKey}`);
      continue; // Skip this iteration to avoid unique constraint violation within this batch
    }
    uniqueConstraintCheck.add(uniqueKey);

    const recordEntry = {
      // id is auto-generated by DB
      guard_user_id: randomGuard.id,
      guard_name_recorded: randomGuard.name,
      course_name: course.name,
      completed_date: formattedCompletedDate,
      expiry_date: formattedExpiryDate,
      certificate_url: getRandomElement(CERTIFICATE_PLACEHOLDERS),
      added_by_user_id: randomAdder.id,
      // site_id: DUMMY_SITE_ID, // Add if your table schema has it
    };
    generatedRecords.push(recordEntry);
  }


  if (generatedRecords.length === 0) {
    console.log("No training records were generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedRecords.length} training record(s) locally.`);

  // Deletion strategy: Delete existing training records for the dummy guards being processed
  // This makes the script re-runnable for a consistent test set for these guards.
  const guardUserIdsToClear = guardUsers.map(g => g.id);
  if (guardUserIdsToClear.length > 0) {
      console.log(`Deleting existing training records for ${guardUserIdsToClear.length} processed guards...`);
      try {
          const { error: deleteError } = await supabaseAdmin
              .from('training_records')
              .delete()
              .in('guard_user_id', guardUserIdsToClear);
          if (deleteError) {
              console.error("Error deleting existing training records:", deleteError.message);
          } else {
              console.log("Successfully deleted existing training records for the selected guards.");
          }
      } catch (error) {
          console.error("Unexpected error during deletion phase:", error);
      }
  }


  // Insert the new batch
  console.log(`Inserting ${generatedRecords.length} new training records into Supabase...`);
  try {
    // Chunk inserts if too many records, though 40 should be fine.
    const { data, error: insertError } = await supabaseAdmin
      .from('training_records')
      .insert(generatedRecords)
      .select();

    if (insertError) {
      console.error('Error inserting new training records:', insertError.message);
      if (insertError.code === '23505') { // PostgreSQL unique violation
        console.error("Details:", insertError.details, "\nHint:", insertError.hint);
        console.error("This might be due to the (guard_name_recorded, course_name, expiry_date) unique constraint if records from a previous partial run or manual entries exist and weren't covered by the delete logic.");
      }
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new training records.`);
    if (data && data.length < generatedRecords.length) {
        console.warn(`Some records may not have been inserted. Prepared: ${generatedRecords.length}, Inserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed training records:', error);
  } finally {
    console.log("Training records seeding process complete.");
  }
}

seedTrainingRecords().catch(error => {
  console.error("Unhandled error in seedTrainingRecords:", error);
});
