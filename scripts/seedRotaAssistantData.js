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
// Run the script from the project root using: node scripts/seedRotaAssistantData.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const crypto = require('crypto'); // For UUIDs if not DB generated for some reason

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

// --- Helper Functions ---
function getRandomElement(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset(arr, minCount, maxCount) {
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}


// --- Main Seeding Function ---
async function seedAllData() {
  console.log("\n--- Starting AI Rota Assistant Data Seeding ---");

  // 1. Fetch Users (Guards and Admins/Supervisors)
  let guards = [];
  let adminsOrSupervisors = [];
  try {
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, guard_name'); // Assuming 'id' is the auth.users.id
    if (profilesError) throw profilesError;

    guards = profilesData.filter(p => p.role === 'guard');
    adminsOrSupervisors = profilesData.filter(p => ['admin', 'supervisor'].includes(p.role));

    if (guards.length === 0) {
        console.warn("No guards found in profiles. Some seeding steps might be skipped or fail.");
    }
    if (adminsOrSupervisors.length === 0) {
        console.warn("No admins/supervisors found. Using first guard as fallback for 'created_by' fields if necessary.");
        if (guards.length > 0) adminsOrSupervisors = [guards[0]]; // Fallback
    }
     console.log(`Fetched ${guards.length} guards and ${adminsOrSupervisors.length} admins/supervisors.`);

  } catch (error) {
    console.error("Fatal error fetching users:", error.message);
    return; // Stop if users can't be fetched
  }


  // 2. Seed `sites` Table
  console.log("\n--- Seeding 'sites' table ---");
  const dummySites = [
    { id: 'a1b2c3d4-e5f6-7777-8888-9999aaaa0001', name: "Innovatech Park Reading", address: "100 Innovation Drive, Reading, RG2 6UB" },
    { id: 'a1b2c3d4-e5f6-7777-8888-9999aaaa0002', name: "City Center Mall", address: "1 Market Square, London, EC1A 1AA" },
    { id: 'a1b2c3d4-e5f6-7777-8888-9999aaaa0003', name: "Warehouse Unit 7", address: "7 Industrial Estate, Slough, SL1 4XX" }
  ];
  // Upsert sites based on 'id' to ensure consistency if script is re-run
  const { data: seededSites, error: sitesError } = await supabaseAdmin
    .from('sites')
    .upsert(dummySites, { onConflict: 'id' })
    .select();

  if (sitesError) {
    console.error("Error seeding sites:", sitesError.message);
  } else {
    console.log(`Upserted ${seededSites ? seededSites.length : 0} sites.`);
  }
  const siteIds = seededSites ? seededSites.map(s => s.id) : [];


  // 3. Update `profiles` Table for Guards
  console.log("\n--- Updating 'profiles' table for selected guards ---");
  if (guards.length > 0) {
    const guardsToUpdate = getRandomSubset(guards, Math.min(5, guards.length), Math.min(7, guards.length));
    console.log(`Selected ${guardsToUpdate.length} guards to update profiles.`);
    const skillCertificationsOptions = ['first_aid', 'cctv_operator', 'door_supervisor', 'fire_marshal', 'vehicle_banksman', 'mental_health_first_aid'];

    for (const guard of guardsToUpdate) {
      const availability = {};
      if (Math.random() < 0.3) availability.monday = "unavailable";
      if (Math.random() < 0.5) availability.tuesday = { start: "08:00", end: "17:00" }; else availability.tuesday = "available";
      if (Math.random() < 0.3) availability.wednesday = "days_only";
      if (Math.random() < 0.2) availability.saturday = "nights_only";
      if (Object.keys(availability).length === 0 && Math.random() < 0.5) availability.default = "available";


      const profileUpdate = {
        availability_preferences: Object.keys(availability).length > 0 ? availability : { default: "flexible" },
        max_hours_per_week: getRandomElement([30, 40, 48, 55, 48, 48]), // Skew towards default 48
        skill_certifications: getRandomSubset(skillCertificationsOptions, 1, 3)
      };

      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', guard.id);

      if (profileUpdateError) {
        console.error(`Error updating profile for guard ${guard.id} (${guard.guard_name}):`, profileUpdateError.message);
      } else {
        console.log(`Updated profile for guard ${guard.guard_name}. Skills: ${profileUpdate.skill_certifications.join(', ')}`);
      }
    }
  } else {
      console.log("Skipping profile updates as no guards were found.");
  }


  // 4. Seed `time_off_requests` Table
  console.log("\n--- Seeding 'time_off_requests' table ---");
  if (guards.length > 0) {
    const timeOffRequests = [];
    const numRequests = Math.floor(Math.random() * 6) + 5; // 5-10 requests
    const reasons = ["Vacation", "Personal Leave", "Medical Appointment", "Family Emergency", "Training Course"];
    const statuses = ["pending", "approved", "approved", "declined", "pending"];

    for (let i = 0; i < numRequests; i++) {
      const randomGuard = getRandomElement(guards);
      const startDate = dayjs().add(Math.floor(Math.random() * 60) - 30, 'day'); // +/- 30 days from today
      const duration = Math.floor(Math.random() * 5) + 1; // 1-5 days
      const endDate = startDate.add(duration -1, 'day');

      timeOffRequests.push({
        user_id: randomGuard.id,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        reason: getRandomElement(reasons),
        status: getRandomElement(statuses),
      });
    }
    const { error: timeOffError } = await supabaseAdmin.from('time_off_requests').insert(timeOffRequests);
    if (timeOffError) {
      console.error("Error seeding time_off_requests:", timeOffError.message);
    } else {
      console.log(`Inserted ${timeOffRequests.length} time off requests.`);
    }
  } else {
      console.log("Skipping time off requests seeding as no guards were found.");
  }


  // 5. Seed `shift_requirements` Table
  console.log("\n--- Seeding 'shift_requirements' table ---");
  if (siteIds.length > 0) {
    const shiftRequirements = [];
    const skills = ['first_aid_level_2', 'cctv_licenced_public_space', 'fire_warden_certified', 'conflict_management_level_3'];
    const licences = ['door_supervisor', 'security_guard', 'cctv_pss', null]; // null means no specific licence, just skill

    for (const siteId of siteIds) {
      const numRequirementsPerSite = Math.floor(Math.random() * 2) + 2; // 2-3 requirements per site
      for (let i = 0; i < numRequirementsPerSite; i++) {
        shiftRequirements.push({
          site_id: siteId,
          required_skill: getRandomElement(skills),
          required_licence: getRandomElement(licences),
          notes: `Requirement auto-seeded for site ${siteId.substring(0,8)}. Specifics TBD.`
        });
      }
    }
    const { error: reqError } = await supabaseAdmin.from('shift_requirements').insert(shiftRequirements);
    if (reqError) {
      console.error("Error seeding shift_requirements:", reqError.message);
    } else {
      console.log(`Inserted ${shiftRequirements.length} shift requirements.`);
    }
  } else {
      console.log("Skipping shift requirements seeding as no sites were created/found.");
  }

  console.log("\n--- AI Rota Assistant Data Seeding Complete ---");
}

seedAllData().catch(error => {
  console.error("Unhandled error in main seeding execution:", error);
});
