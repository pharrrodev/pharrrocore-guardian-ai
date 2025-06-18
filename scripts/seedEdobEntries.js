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
// Run the script from the project root using: node scripts/seedEdobEntries.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const crypto = require('crypto'); // For UUID for client-side id if needed, but DB generates PK

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

// --- Data Definitions (simplified from edob-types.ts for script use) ---
const ENTRY_TYPES = ['Patrol', 'Incident / Observation', 'Access Control', 'Alarm Activation'];
const PATROL_ROUTES = ["Main Perimeter Route", "Internal Route - Floor 1", "Internal Route - Floor 2", "Car Park Route", "Service Yard Route"];
const ACCESS_TYPES = ["Visitor Entry", "Contractor Entry", "Delivery", "Staff Entry (Irregular Hours)"];
const ALARM_ZONES = ["Zone 1 - Reception", "Zone 2 - West Wing", "Zone 3 - Data Center", "Zone 4 - Loading Bay", "Zone 5 - Perimeter Fence"];
const ALARM_TYPES = ["Fire Alarm", "Intruder Alarm", "Panic Alarm", "Tamper Alert", "System Fault"];

const SAMPLE_LOCATIONS = ["Reception Desk", "West Wing Corridor", "Server Room 3B", "Loading Bay 2", "East Perimeter Fence", "Staff Canteen"];
const SAMPLE_PERSON_NAMES = ["Alice Wonderland", "Bob The Builder", "Charlie Chaplin", "Diana Prince", "Edward Scissorhands"];
const SAMPLE_COMPANIES = ["Acme Corp", "Wayne Enterprises", "Stark Industries", "Globex Corporation", "Cyberdyne Systems"];
const SAMPLE_REASONS = ["routine check", "scheduled maintenance", "investigate noise", "system test", "cobwebs"];

const DUMMY_SITE_ID = '00000000-0000-0000-0000-000000000001'; // Example Site ID, if your schema uses it
const NUMBER_OF_ENTRIES_TO_GENERATE = 150; // Target 100-200
const DATE_RANGE_DAYS = 7; // Generate entries for today +/- DATE_RANGE_DAYS

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDetailText(entryType, guardName) {
  const location = getRandomElement(SAMPLE_LOCATIONS);
  switch (entryType) {
    case 'Patrol':
      return `Patrol of ${getRandomElement(PATROL_ROUTES)} completed by ${guardName}. All secure. Checked ${location}.`;
    case 'Incident / Observation':
      const incidentTypes = ["Minor water leak", "Suspicious person reported", "Safety hazard found", "Unsecured door discovered"];
      const observationTypes = ["CCTV camera offline", "Fence panel damaged", "Unusual noise heard", "Lights malfunctioning"];
      const isIncident = Math.random() < 0.5;
      const detailType = isIncident ? getRandomElement(incidentTypes) : getRandomElement(observationTypes);
      return `${detailType} at ${location}. Reported by ${guardName}. Further action: [Specify or Logged]`;
    case 'Access Control':
      const person = getRandomElement(SAMPLE_PERSON_NAMES);
      const company = getRandomElement(SAMPLE_COMPANIES);
      const purpose = getRandomElement(["Meeting", "Maintenance", "Delivery", "Interview"]);
      return `${getRandomElement(ACCESS_TYPES)}: ${person} from ${company} granted access for ${purpose}. Escorted by ${guardName} to ${location}.`;
    case 'Alarm Activation':
      const reason = getRandomElement(SAMPLE_REASONS);
      return `${getRandomElement(ALARM_TYPES)} activated in ${getRandomElement(ALARM_ZONES)}. Investigated by ${guardName}, confirmed false alarm due to ${reason}. System reset.`;
    default:
      return `Generic log entry for ${entryType} at ${location} by ${guardName}.`;
  }
}

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

async function seedEdobEntries() {
  console.log("Starting EDOB entries seeding process...");
  let guardUsers;
  try {
    guardUsers = await fetchGuardUsers();
  } catch (error) {
    console.error("Could not proceed without guard users. Exiting.");
    return;
  }

  const generatedEntries = [];
  const today = dayjs();

  for (let i = 0; i < NUMBER_OF_ENTRIES_TO_GENERATE; i++) {
    const randomGuard = getRandomElement(guardUsers);
    if (!randomGuard) continue;

    const dateOffset = Math.floor(Math.random() * (DATE_RANGE_DAYS * 2 + 1)) - DATE_RANGE_DAYS;
    const randomTimestamp = today.add(dateOffset, 'day')
                               .hour(Math.floor(Math.random() * 24))
                               .minute(Math.floor(Math.random() * 60))
                               .second(Math.floor(Math.random() * 60))
                               .toISOString();

    const entryType = getRandomElement(ENTRY_TYPES);

    const entryData = {
      user_id: randomGuard.id, // This is the auth.users.id from profiles.id
      timestamp: randomTimestamp,
      entry_type: entryType,
      details: generateDetailText(entryType, randomGuard.name),
      patrol_route: null,
      access_type: null,
      person_name: null,
      company: null,
      alarm_zone: null,
      alarm_type: null,
      // site_id: DUMMY_SITE_ID, // Add if your EDOB table has site_id and you want to use it
    };

    if (entryType === 'Patrol') {
      entryData.patrol_route = getRandomElement(PATROL_ROUTES);
    } else if (entryType === 'Access Control') {
      entryData.access_type = getRandomElement(ACCESS_TYPES);
      entryData.person_name = getRandomElement(SAMPLE_PERSON_NAMES);
      entryData.company = getRandomElement(SAMPLE_COMPANIES);
    } else if (entryType === 'Alarm Activation') {
      entryData.alarm_zone = getRandomElement(ALARM_ZONES);
      entryData.alarm_type = getRandomElement(ALARM_TYPES);
    }

    generatedEntries.push(entryData);
  }

  if (generatedEntries.length === 0) {
    console.log("No EDOB entries were generated. Exiting.");
    return;
  }

  console.log(`Generated ${generatedEntries.length} EDOB entry records locally.`);

  // Insert the new batch
  // Since 'id' is auto-generated by DB and entries are timestamped, re-running just adds more data, which is fine for EDOB.
  console.log(`Inserting ${generatedEntries.length} new EDOB entry records into Supabase...`);
  try {
    // Supabase client JS v2 insert an array of objects.
    const { data, error: insertError } = await supabaseAdmin
      .from('edob_entries')
      .insert(generatedEntries)
      .select(); // Optional: select to get results back for logging

    if (insertError) {
      console.error('Error inserting new EDOB entries:', insertError.message);
      throw insertError;
    }

    console.log(`Successfully inserted ${data ? data.length : 0} new EDOB entry records.`);
    if (data && data.length < generatedEntries.length) {
        console.warn(`Some entries may not have been inserted. Prepared: ${generatedEntries.length}, Inserted: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed EDOB entries:', error);
  } finally {
    console.log("EDOB entries seeding process complete.");
  }
}

seedEdobEntries().catch(error => {
  console.error("Unhandled error in seedEdobEntries:", error);
});
