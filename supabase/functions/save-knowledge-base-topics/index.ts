// supabase/functions/save-knowledge-base-topics/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Load environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface Topic {
  id: string; // Kebab-case ID
  label: string;
  response: string;
  parent_id?: string | null;
  sort_order?: number;
  subTopics?: Topic[]; // For hierarchical input
}

// Helper function to recursively prepare upsert operations
// This flattens the hierarchy and sets parent_id
const prepareUpserts = (topics: Topic[], parentId: string | null = null): any[] => {
  let operations: any[] = [];
  topics.forEach((topic, index) => {
    const { subTopics, ...topicData } = topic; // Exclude subTopics from the direct insert/upsert data
    operations.push({
      ...topicData,
      parent_id: parentId,
      sort_order: topic.sort_order !== undefined ? topic.sort_order : index, // Use provided sort_order or index
    });
    if (subTopics && subTopics.length > 0) {
      operations = operations.concat(prepareUpserts(subTopics, topic.id));
    }
  });
  return operations;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured.');
    }
    const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });

    // TODO: Consider adding user authentication check here if needed
    // e.g., ensure only specific roles can save topics.
    // For now, service role key allows the operation.

    const { topics } = await req.json(); // Expects { "topics": Topic[] } in request body

    if (!Array.isArray(topics)) {
      return new Response(JSON.stringify({ error: 'Invalid request body: "topics" array is required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (topics.length === 0) {
      return new Response(JSON.stringify({ message: 'No topics provided to save.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    const upsertOperations = prepareUpserts(topics);

    console.log(`Attempting to upsert ${upsertOperations.length} topic operations.`);
    // console.log('Upsert operations:', JSON.stringify(upsertOperations, null, 2));


    // Perform upsert operations
    // `onConflict: 'id'` means if a topic with the same 'id' exists, it will be updated.
    // Otherwise, a new topic will be inserted.
    // Supabase client's `upsert` method handles this.
    const { data, error } = await adminSupabase
      .from('knowledge_base_topics')
      .upsert(upsertOperations, { onConflict: 'id' })
      .select(); // Select to get results back

    if (error) {
      console.error('Error upserting topics:', error);
      // Check for specific error codes if needed, e.g., foreign key violation if parent_id doesn't exist
      // However, since we process hierarchically or all at once, this should be less of an issue
      // if parent topics are always included or already exist.
      throw new Error(`Failed to save topics: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ message: 'Knowledge base topics saved successfully.', data: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in save-knowledge-base-topics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
