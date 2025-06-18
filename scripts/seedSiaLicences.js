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
// Run the script from the project root using: node scripts/seedSiaLicences.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const crypto = require('crypto');

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
const SAMPLE_LICENCE_TYPES = [
    "Door Supervisor", "CCTV Operator (Public Space Surveillance)", "Security Guard",
    "Close Protection", "Vehicle Immobiliser", "Cash and Valuables in Transit"
];
const LICENCE_VALIDITY_YEARS = 3;

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUniqueLicenceNumber(existingNumbersSet) {
  let newNumber;
  do {
    // Generate a 16-character alphanumeric string (common for SIA licences)
    // SIA Licence numbers are typically 16 digits long, starting with 100.
    // This is a simplified representation.
    newNumber = 'SIA-' + Math.random().toString(36).substring(2, 10).toUpperCase() +
                Math.random().toString(36).substring(2, 10).toUpperCase();
  } while (existingNumbersSet.has(newNumber));
  existingNumbersSet.add(newNumber);
  return newNumber;
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

async function seedSiaLicences() {
  console.log("Starting SIA Licences seeding process...");
  let guardUsers, adminUsers;
  try {
    guardUsers = await fetchUsers(['guard']);
    adminUsers = await fetchUsers(['supervisor', 'admin']); // For created_by_user_id
    if (adminUsers.length === 0) {
        console.warn("No supervisors/admins found, using first guard as record creator as a fallback.");
        if (guardUsers.length === 0) throw new Error("No guards available to act as creators either.");
        adminUsers = [guardUsers[0]]; // Use first guard if no admins/supervisors
    }
  } catch (error) {
    console.error("Could not proceed without users. Exiting.", error.message);
    return;
  }

  const generatedLicences = [];
  const today = dayjs();
  const licenceNumbersSet = new Set(); // To ensure uniqueness within this batch

  for (const guard of guardUsers) {
    const numberOfLicencesForThisGuard = Math.random() < 0.2 ? 2 : 1; // 20% chance of having 2 licences

    for (let i = 0; i < numberOfLicencesForThisGuard; i++) {
      const licenceType = getRandomElement(SAMPLE_LICENCE_TYPES);
      // Ensure the second licence is of a different type if generating two
      if (i > 0 && generatedLicences.find(l => l.guard_user_id === guard.id && l.licence_type === licenceType)) {
          continue; // Skip if this type already added for this guard in this run
      }

      const issueDate = today.subtract(Math.floor(Math.random() * (365 * LICENCE_VALIDITY_YEARS - 90)), 'day'); // Issue date up to (validity - 90 days) ago
      let expiryDate = issueDate.add(LICENCE_VALIDITY_YEARS, 'year');
      let status = 'Active';

      // Adjust some expiry dates for variety
      const randomFactor = Math.random();
      if (randomFactor < 0.15) { // ~15% expired
        expiryDate = today.subtract(Math.floor(Math.random() * 180) + 30, 'day'); // Expired 1-6 months ago
      } else if (randomFactor < 0.40) { // ~25% expiring soon (next 90 days)
        expiryDate = today.add(Math.floor(Math.random() * 90) + 1, 'day');
      }
      // Else, use calculated expiry date

      if (expiryDate.isBefore(today)) {
        status = 'Expired';
      }

      const formattedIssueDate = issueDate.format('YYYY-MM-DD');
      const formattedExpiryDate = expiryDate.format('YYYY-MM-DD');
      const licenceNumber = generateUniqueLicenceNumber(licenceNumbersSet);
      const randomCreator = getRandomElement(adminUsers);

      generatedLicences.push({
        guard_user_id: guard.id,
        licence_number: licenceNumber,
        licence_type: licenceType,
        issue_date: formattedIssueDate,
        expiry_date: formattedExpiryDate,
        status: status,
        created_by_user_id: randomCreator.id,
      });
    }
  }

  if (generatedLicences.length === 0) {
    console.log("No SIA licences were generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedLicences.length} SIA licence record(s) locally.`);

  // Deletion strategy: Delete existing SIA licences for the dummy guards being processed.
  const guardUserIdsToClear = guardUsers.map(g => g.id);
  if (guardUserIdsToClear.length > 0) {
      console.log(`Deleting existing SIA licences for ${guardUserIdsToClear.length} processed guards...`);
      try {
          const { error: deleteError } = await supabaseAdmin
              .from('sia_licences')
              .delete()
              .in('guard_user_id', guardUserIdsToClear);
          if (deleteError) {
              console.error("Error deleting existing SIA licences:", deleteError.message);
          } else {
              console.log("Successfully deleted existing SIA licences for the selected guards.");
          }
      } catch (error) {
          console.error("Unexpected error during deletion phase:", error);
      }
  }

  // Insert the new batch
  console.log(`Inserting ${generatedLicences.length} new SIA licence records into Supabase...`);
  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('sia_licences')
      .insert(generatedLicences)
      .select();

    if (insertError) {
      console.error('Error inserting new SIA licences:', insertError.message);
      if (insertError.code === '23505') { // PostgreSQL unique violation for licence_number
        console.error("Details:", insertError.details, "\nHint:", insertError.hint);
        console.error("This might be due to the licence_number unique constraint if a generated number collided with one not deleted (e.g. for a different guard_user_id not in this batch's cleanup).");
      }
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new SIA licence records.`);
    if (data && data.length < generatedLicences.length) {
        console.warn(`Some records may not have been inserted. Prepared: ${generatedLicences.length}, Inserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed SIA licences:', error);
  } finally {
    console.log("SIA licences seeding process complete.");
  }
}

seedSiaLicences().catch(error => {
  console.error("Unhandled error in seedSiaLicences:", error);
});
