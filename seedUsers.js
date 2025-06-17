// This script is designed to be run in a Node.js environment.
// Ensure you have `dotenv` and `@supabase/supabase-js` installed:
// npm install dotenv @supabase/supabase-js
// or
// yarn add dotenv @supabase/supabase-js
//
// Create a .env file in the same directory with your Supabase URL and Service Role Key:
// SUPABASE_URL=your_supabase_url
// SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
//
// Run the script using: node seedUsers.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

const commonPassword = 'password123';

const usersToCreate = [
  // Guards
  ...Array.from({ length: 12 }, (_, i) => ({
    email: `guard${i + 1}@example.com`,
    password: commonPassword,
    user_metadata: { full_name: `Guard User ${i + 1}` },
    targetRole: 'guard', // The trigger handles setting 'guard' initially
  })),
  // Supervisors
  ...Array.from({ length: 3 }, (_, i) => ({
    email: `supervisor${i + 1}@example.com`,
    password: commonPassword,
    user_metadata: { full_name: `Supervisor User ${i + 1}` },
    targetRole: 'supervisor',
  })),
  // Admins
  {
    email: `admin1@example.com`,
    password: commonPassword,
    user_metadata: { full_name: `Admin User 1` },
    targetRole: 'admin',
  },
  {
    email: `admin2@example.com`,
    password: commonPassword,
    user_metadata: { full_name: `Admin User 2` },
    targetRole: 'admin',
  },
];

async function seedUsers() {
  console.log(`Starting user seeding process for ${usersToCreate.length} users...`);
  const createdUsers = []; // To store { id, targetRole } for role updates

  for (const userSpec of usersToCreate) {
    try {
      console.log(`Attempting to create user: ${userSpec.email}`);
      const { data: userCreationData, error: creationError } = await supabaseAdmin.auth.admin.createUser({
        email: userSpec.email,
        password: userSpec.password,
        email_confirm: true, // Auto-confirm email for these dummy users
        user_metadata: userSpec.user_metadata,
      });

      if (creationError) {
        if (creationError.message.includes('Email rate limit exceeded') || creationError.message.includes('same email')) {
            console.warn(`Skipping user ${userSpec.email} due to rate limit or already exists: ${creationError.message}`);
            // Attempt to fetch the existing user to get their ID for role update
            const { data: existingUserData, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({ email: userSpec.email });
            if (getUserError || !existingUserData || existingUserData.users.length === 0) {
                console.error(`Could not retrieve existing user ${userSpec.email}: ${getUserError?.message}`);
                continue;
            }
            const existingUser = existingUserData.users[0];
            console.log(`User ${userSpec.email} already exists with ID: ${existingUser.id}. Will attempt role update if needed.`);
            createdUsers.push({ id: existingUser.id, email: userSpec.email, targetRole: userSpec.targetRole, new_user_created_in_auth: false });

        } else {
            console.error(`Error creating user ${userSpec.email}: ${creationError.message}`);
        }
        continue; // Skip to next user
      }

      if (userCreationData && userCreationData.user) {
        console.log(`Successfully created user in auth.users: ${userCreationData.user.email} (ID: ${userCreationData.user.id})`);
        createdUsers.push({ id: userCreationData.user.id, email: userCreationData.user.email, targetRole: userSpec.targetRole, new_user_created_in_auth: true });
        // The handle_new_user trigger should have created a profile with role 'guard' and populated guard_name & guard_id.
      } else {
        console.warn(`User creation data or user object is null for ${userSpec.email}, but no explicit error was thrown.`);
      }
    } catch (error) {
      console.error(`Unexpected error during creation of user ${userSpec.email}:`, error);
    }
  }

  console.log(`\n--- User Creation Summary ---`);
  console.log(`${createdUsers.filter(u => u.new_user_created_in_auth).length} new users created in auth.users.`);
  console.log(`${createdUsers.filter(u => !u.new_user_created_in_auth).length} users already existed or were rate limited (ID retrieved for role update).`);


  console.log("\nStarting profile role update process...");
  let rolesUpdatedCount = 0;
  let profilesVerifiedOrSkipped = 0;

  for (const userInfo of createdUsers) {
    if (userInfo.targetRole === 'guard') {
      // Verify profile exists and has 'guard' role (set by trigger)
      try {
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('role, guard_name, guard_id')
          .eq('id', userInfo.id)
          .single();

        if (profileError) {
          console.error(`Error fetching profile for guard ${userInfo.email} (ID: ${userInfo.id}): ${profileError.message}`);
        } else if (profile) {
          if (profile.role === 'guard') {
            console.log(`Profile for guard ${userInfo.email} correctly set to 'guard' by trigger. Name: ${profile.guard_name}, GuardID: ${profile.guard_id}`);
            profilesVerifiedOrSkipped++;
          } else {
            console.warn(`Profile for guard ${userInfo.email} has role '${profile.role}', expected 'guard'. Attempting to fix...`);
            // Attempt to fix if it wasn't set correctly by trigger for some reason
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ role: 'guard' })
              .eq('id', userInfo.id);
            if (updateError) {
              console.error(`Failed to fix role for guard ${userInfo.email}: ${updateError.message}`);
            } else {
              console.log(`Role for guard ${userInfo.email} fixed to 'guard'.`);
              rolesUpdatedCount++;
            }
          }
        } else {
            console.warn(`Profile not found for guard ${userInfo.email} (ID: ${userInfo.id}). The trigger might have failed or is delayed.`);
        }
      } catch (error) {
        console.error(`Unexpected error verifying profile for guard ${userInfo.email}:`, error);
      }
      continue; // No role update needed from 'guard' to something else by this script
    }

    // Update role for supervisors and admins
    try {
      console.log(`Attempting to update role to '${userInfo.targetRole}' for user ${userInfo.email} (ID: ${userInfo.id})`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles') // Assuming your profiles table is named 'profiles'
        .update({ role: userInfo.targetRole, updated_at: new Date().toISOString() })
        .eq('id', userInfo.id)
        .select(); // Select to confirm update

      if (updateError) {
        console.error(`Error updating role for ${userInfo.email} (ID: ${userInfo.id}): ${updateError.message}`);
      } else if (updateData && updateData.length > 0) {
        console.log(`Successfully updated role to '${userInfo.targetRole}' for ${userInfo.email}. Profile: ${JSON.stringify(updateData[0])}`);
        rolesUpdatedCount++;
      } else {
        console.warn(`Profile not found or not updated for ${userInfo.email} (ID: ${userInfo.id}). The trigger might have failed or is delayed, or user has no profile yet.`);
      }
    } catch (error) {
      console.error(`Unexpected error during role update for user ${userInfo.email}:`, error);
    }
  }
  console.log(`\n--- Profile Role Update Summary ---`);
  console.log(`${rolesUpdatedCount} user roles explicitly updated by script (or fixed).`);
  console.log(`${profilesVerifiedOrSkipped} guard profiles verified or skipped role update as already 'guard'.`);
  console.log("\nUser seeding process complete.");
  console.log("Please verify users in Supabase dashboard: auth.users table and public.profiles table.");
}

seedUsers().catch(console.error);
