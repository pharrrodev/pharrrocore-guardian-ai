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
// Run the script from the project root using: node scripts/seedUniformChecks.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const crypto = require('crypto'); // For UUID if DB didn't auto-generate, but it does.
const { uniformKitItems } = require('../src/data/centralData'); // Adjust path if necessary

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file.");
  process.exit(1);
}
if (!uniformKitItems || uniformKitItems.length === 0) {
    console.error("Error: uniformKitItems not found or empty in centralData.ts. Please check the import path and data.");
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
const SAMPLE_ISSUE_COMMENTS = [
    "Hi-Vis needs cleaning.", "Boots scuffed but serviceable.", "ID badge slightly cracked.",
    "Radio battery seems low.", "Shirt not tucked in properly.", "Missing one epaulette.",
    "Incorrect lanyard used.", "Trousers have a small tear."
];
const DUMMY_SITE_ID = '00000000-0000-0000-0000-000000000001'; // Example Site ID
const NUMBER_OF_CHECKS_TO_GENERATE = 25; // Target 20-30
const DATE_RANGE_DAYS = 7; // Generate checks for today +/- DATE_RANGE_DAYS
const PERCENT_WITH_ISSUES = 0.3; // 30% of checks will have some non-confirmed items

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

async function seedUniformChecks() {
  console.log("Starting Uniform Checks seeding process...");
  let guardUsers, checkerUsers;
  try {
    guardUsers = await fetchUsers(['guard']);
    // For checkers, let's assume supervisors or admins can perform checks
    checkerUsers = await fetchUsers(['supervisor', 'admin']);
    if (checkerUsers.length === 0) { // Fallback if no supervisors/admins, guards can check each other
        console.warn("No supervisors/admins found, using guards as checkers as a fallback.");
        checkerUsers = guardUsers;
    }
  } catch (error) {
    console.error("Could not proceed without users. Exiting.");
    return;
  }

  const generatedChecks = [];
  const today = dayjs();

  for (let i = 0; i < NUMBER_OF_CHECKS_TO_GENERATE; i++) {
    const randomGuard = getRandomElement(guardUsers);
    const randomChecker = getRandomElement(checkerUsers);
    if (!randomGuard || !randomChecker) {
        console.warn("Skipping check generation due to missing guard or checker.");
        continue;
    }

    const dateOffset = Math.floor(Math.random() * (DATE_RANGE_DAYS * 2 + 1)) - DATE_RANGE_DAYS;
    const checkTimestamp = today.add(dateOffset, 'day')
                               .hour(Math.floor(Math.random() * 2) + 7) // Typically at start of shift, e.g., 7-8 AM
                               .minute(Math.floor(Math.random() * 60))
                               .toISOString();

    let currentChecklistItems = JSON.parse(JSON.stringify(uniformKitItems)); // Deep copy
    let comments = [];

    if (Math.random() < PERCENT_WITH_ISSUES) {
      const itemsToFailCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 items fail
      for (let j = 0; j < itemsToFailCount; j++) {
        if (currentChecklistItems.length > 0) {
          const itemIndexToFail = Math.floor(Math.random() * currentChecklistItems.length);
          if (currentChecklistItems[itemIndexToFail].confirmed) { // Only fail if not already failed
            currentChecklistItems[itemIndexToFail].confirmed = false;
            comments.push(`Issue with ${currentChecklistItems[itemIndexToFail].label}: ${getRandomElement(SAMPLE_ISSUE_COMMENTS)}`);
          }
        }
      }
    }

    const checkEntry = {
      // id is auto-generated by DB
      guard_id: randomGuard.id,
      guard_name_checked: randomGuard.name,
      checker_user_id: randomChecker.id,
      check_timestamp: checkTimestamp,
      checklist_items: currentChecklistItems,
      additional_comments: comments.length > 0 ? comments.join(' ') : null,
      site_id: DUMMY_SITE_ID,
    };
    generatedChecks.push(checkEntry);
  }

  if (generatedChecks.length === 0) {
    console.log("No uniform checks were generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedChecks.length} uniform check records locally.`);

  // Insert the new batch
  console.log(`Inserting ${generatedChecks.length} new uniform check records into Supabase...`);
  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('uniform_checks')
      .insert(generatedChecks)
      .select();

    if (insertError) {
      console.error('Error inserting new uniform checks:', insertError.message);
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new uniform check records.`);
    if (data && data.length < generatedChecks.length) {
        console.warn(`Some checks may not have been inserted. Prepared: ${generatedChecks.length}, Inserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed uniform checks:', error);
  } finally {
    console.log("Uniform checks seeding process complete.");
  }
}

seedUniformChecks().catch(error => {
  console.error("Unhandled error in seedUniformChecks:", error);
});
