// supabase/functions/get-guard-list/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Assuming a shared CORS setup

// Load environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL environment variable.')
}
if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
}

serve(async (req: Request) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured correctly in the function environment.')
    }

    // Create a Supabase client with the service role key to access auth.users
    // This client bypasses RLS and should be used carefully.
    const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        // It's generally a good practice to set autoRefreshToken and persistSession to false
        // for server-side clients, especially when using a service role key.
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      }
    })

    // Note: You might want to verify the incoming request's Authorization header
    // if you want to ensure only authenticated users can *call* this function,
    // even if the function itself uses an admin client for its operations.
    // const authHeader = req.headers.get('Authorization')
    // if (!authHeader) {
    //   return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
    //     status: 401,
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   })
    // }
    // Here you could verify the JWT if needed, or rely on Supabase's default JWT verification
    // if --no-verify-jwt is NOT used during deployment.

    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers({
      // Consider pagination for large numbers of users
      // page: 1,
      // perPage: 1000,
    });

    if (listError) {
      console.error('Error listing users:', listError)
      throw listError;
    }

    const guardList = users
      // Optional: Attempt to filter for users who might be guards.
      // This is a placeholder for actual role-based filtering logic.
      // Example: Filter if a specific metadata field indicates a 'guard' role.
      // .filter(user => user.user_metadata?.app_role === 'guard' || user.user_metadata?.role === 'guard')
      // Ensure users have an email, as it's used as a fallback for name.
      .filter(user => user.email) // Basic filter to ensure email exists
      .map(user => ({
        id: user.id,
        // Prioritize full_name from metadata, then name, then email as the display name
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        email: user.email // also include email for reference
      }));

    return new Response(
      JSON.stringify(guardList),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in get-guard-list function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

// To run locally (optional, for testing with Deno CLI):
// deno run --allow-net --allow-env supabase/functions/get-guard-list/index.ts
// Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment or a .env file.
// Example .env file content:
// SUPABASE_URL=your_supabase_project_url
// SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
//
// You might need a .env loader if running locally, e.g., from https://deno.land/std/dotenv/mod.ts
// import "https://deno.land/std/dotenv/load.ts"; // at the top of the file
// Then run with: deno run --allow-net --allow-env --allow-read supabase/functions/get-guard-list/index.ts
// (add --allow-read for .env file access)
//
// For shared CORS, create supabase/functions/_shared/cors.ts:
// export const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Adjust for production
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };
