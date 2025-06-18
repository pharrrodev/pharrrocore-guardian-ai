// supabase/functions/add-training-record/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Load environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface TrainingRecordPayload {
  guard_user_id?: string | null; // UUID of the guard if they are a system user
  guard_name_recorded: string;   // Name of the guard as known/selected
  course_name: string;
  completed_date: string;        // Expected format: YYYY-MM-DD
  expiry_date: string;           // Expected format: YYYY-MM-DD
  certificate_url?: string | null;
  // site_id?: string | null; // Optional: If site context is needed
}

serve(async (req: Request) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured correctly.')
    }

    // Create Supabase admin client to bypass RLS for insert and duplicate check
    const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    })

    // Get the invoking user's ID from the Authorization header (JWT)
    // Supabase automatically populates `auth.uid()` in RLS policies based on this.
    // For functions, if you need user ID for application logic (like setting added_by_user_id),
    // you'd typically get it from the token.
    // However, the Supabase client used with the user's token can also be used if you want RLS to apply
    // for the insert itself, but here we need admin for duplicate check potentially across all records.

    // For setting 'added_by_user_id', we need the user's ID from their token.
    // The request invoker's JWT is automatically passed by Supabase.
    // We can create a new client instance specifically for getting the user context.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Create a client with the user's token to get their ID
    const userSupabase = createClient(supabaseUrl, req.headers.get('anon_key') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user from token:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed or user not found.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const added_by_user_id = user.id;

    // Parse request body
    const payload: TrainingRecordPayload = await req.json()
    if (!payload.guard_name_recorded || !payload.course_name || !payload.completed_date || !payload.expiry_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: guard_name_recorded, course_name, completed_date, expiry_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Duplicate Check: (guard_name_recorded, course_name, expiry_date)
    // This aligns with the UNIQUE constraint defined in the migration.
    // The database will enforce this, but an early check can provide a friendlier error.
    const { data: existingRecords, error: checkError } = await adminSupabase
      .from('training_records')
      .select('id')
      .eq('guard_name_recorded', payload.guard_name_recorded)
      .eq('course_name', payload.course_name)
      .eq('expiry_date', payload.expiry_date);

    if (checkError) {
      console.error('Error checking for duplicate training records:', checkError);
      throw new Error(`Error during duplicate check: ${checkError.message}`);
    }

    if (existingRecords && existingRecords.length > 0) {
      return new Response(
        JSON.stringify({ error: 'This training record (Guard, Course, Expiry Date) already exists.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 409 Conflict
      );
    }

    // Prepare data for insertion
    const recordToInsert = {
      guard_user_id: payload.guard_user_id || null,
      guard_name_recorded: payload.guard_name_recorded,
      course_name: payload.course_name,
      completed_date: payload.completed_date,
      expiry_date: payload.expiry_date,
      certificate_url: payload.certificate_url || null,
      added_by_user_id: added_by_user_id,
      // site_id: payload.site_id || null, // If site_id is part of payload
    };

    const { data: newRecord, error: insertError } = await adminSupabase
      .from('training_records')
      .insert(recordToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting training record:', insertError);
      // Check if it's a unique constraint violation (code 23505 for PostgreSQL)
      if (insertError.code === '23505') {
         return new Response(
          JSON.stringify({ error: 'This training record (Guard, Course, Expiry Date) already exists. Constraint violated.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Failed to add training record: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ message: 'Training record added successfully', data: newRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in add-training-record function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: (error.message.includes("already exists") ? 409 : 500), headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
