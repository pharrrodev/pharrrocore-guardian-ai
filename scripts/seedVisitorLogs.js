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
// Run the script from the project root using: node scripts/seedVisitorLogs.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const crypto = require('crypto'); // For UUID if needed, though DB generates PK

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
const VISITOR_NAMES = ["Alice Johnson", "Bob Williams", "Carol Davis", "David Miller", "Eve Wilson", "Frank Moore", "Grace Taylor", "Henry Anderson"];
const COMPANIES = ["Innovatech Solutions", "Apex Logistics", "Synergy Corp", "Momentum Dynamics", "Starlight Enterprises", null, "Self-Employed", "N/A"]; // Added null/NA
const VISIT_PURPOSES = ["Scheduled Meeting", "Delivery Drop-off", "Site Inspection", "Maintenance Work", "Job Interview", "Client Visit"];
const PERSONS_TO_VISIT = ["Site Manager", "Sarah (HR)", "John (Operations)", "Maintenance Dept", "Security Office", "Reception"];
const VEHICLE_REGISTRATIONS = ["AB12 CDE", "XY34 ZYX", "GH56 JKL", null, "MN78 OPQ", "VU90 RST", null]; // Some without vehicles
const PHOTO_URLS = [null, "https://placehold.co/300x300.png?text=Visitor", null, null]; // Some with photos

const DUMMY_SITE_ID = '00000000-0000-0000-0000-000000000001'; // Example Site ID
const NUMBER_OF_LOGS_TO_GENERATE = 40; // Target 30-50
const DATE_RANGE_DAYS = 7; // Generate logs for today +/- DATE_RANGE_DAYS
const PERCENT_STILL_ON_SITE = 0.25; // 25% of visitors still on-site

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchUsers() {
  console.log("Fetching users (guards/supervisors) from 'profiles' table...");
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id') // 'id' here is auth.users.id
    .in('role', ['guard', 'supervisor', 'admin']); // Users who can perform check-in/out

  if (error) {
    console.error("Error fetching users:", error.message);
    throw error;
  }
  if (!users || users.length === 0) {
    throw new Error("No users found with roles 'guard', 'supervisor', or 'admin' in profiles table. Please run seedUsers.js first.");
  }
  console.log(`Found ${users.length} users who can perform check-ins/outs.`);
  return users.map(u => u.id); // Return array of UUIDs
}

async function seedVisitorLogs() {
  console.log("Starting Visitor Logs seeding process...");
  let systemUserIds;
  try {
    systemUserIds = await fetchUsers();
  } catch (error) {
    console.error("Could not proceed without system users for check-in/out. Exiting.");
    return;
  }

  const generatedLogs = [];
  const today = dayjs();

  for (let i = 0; i < NUMBER_OF_LOGS_TO_GENERATE; i++) {
    const dateOffset = Math.floor(Math.random() * (DATE_RANGE_DAYS * 2 + 1)) - DATE_RANGE_DAYS;
    const arrivalTime = today.add(dateOffset, 'day')
                             .hour(Math.floor(Math.random() * 10) + 8) // 8 AM to 5 PM (17:00)
                             .minute(Math.floor(Math.random() * 60))
                             .second(Math.floor(Math.random() * 60))
                             .toISOString();

    let departureTime = null;
    let userIdCheckOut = null;

    const stillOnSite = Math.random() < PERCENT_STILL_ON_SITE;
    const isPastArrival = dayjs().isAfter(dayjs(arrivalTime));

    if (!stillOnSite && isPastArrival) { // Only set departure if not on site AND it's in the past
      const durationHours = Math.floor(Math.random() * 8) + 1; // 1 to 8 hours visit
      departureTime = dayjs(arrivalTime).add(durationHours, 'hour').toISOString();
      // Ensure departure is not in the future if arrival was today
      if (dayjs(departureTime).isAfter(dayjs())) {
          departureTime = dayjs().subtract(Math.floor(Math.random() * 30), 'minute').toISOString(); // Departed recently
      }
      userIdCheckOut = getRandomElement(systemUserIds);
    } else if (stillOnSite && !isPastArrival) {
      // If arrival is in future, they cannot be "still on site" in a meaningful way yet, so no departure.
      departureTime = null;
      userIdCheckOut = null;
    }
    // If arrival is in the past and stillOnSite is true, departureTime remains null.


    const logEntry = {
      // id is auto-generated by DB
      visitor_name: getRandomElement(VISITOR_NAMES),
      company: getRandomElement(COMPANIES),
      visit_purpose: getRandomElement(VISIT_PURPOSES),
      person_to_visit: getRandomElement(PERSONS_TO_VISIT),
      arrival_time: arrivalTime,
      user_id_check_in: getRandomElement(systemUserIds),
      departure_time: departureTime,
      user_id_check_out: userIdCheckOut,
      photo_url: getRandomElement(PHOTO_URLS),
      vehicle_registration: getRandomElement(VEHICLE_REGISTRATIONS),
      site_id: DUMMY_SITE_ID,
      // created_at and updated_at will be set by Supabase (updated_at via trigger if exists on this table)
    };
    generatedLogs.push(logEntry);
  }

  if (generatedLogs.length === 0) {
    console.log("No visitor logs were generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedLogs.length} visitor log records locally.`);

  // Insert the new batch
  console.log(`Inserting ${generatedLogs.length} new visitor log records into Supabase...`);
  try {
    const { data, error: insertError } = await supabaseAdmin
      .from('visitor_logs')
      .insert(generatedLogs)
      .select();

    if (insertError) {
      console.error('Error inserting new visitor logs:', insertError.message);
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new visitor log records.`);
    if (data && data.length < generatedLogs.length) {
        console.warn(`Some logs may not have been inserted. Prepared: ${generatedLogs.length}, Inserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed visitor logs:', error);
  } finally {
    console.log("Visitor logs seeding process complete.");
  }
}

seedVisitorLogs().catch(error => {
  console.error("Unhandled error in seedVisitorLogs:", error);
});
