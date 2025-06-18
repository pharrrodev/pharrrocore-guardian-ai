// This script is designed to be run in a Node.js environment.
// Ensure you have `dotenv` and `@supabase/supabase-js` installed:
// npm install dotenv @supabase/supabase-js
// or
// yarn add dotenv @supabase/supabase-js
//
// Create a .env file in the project root with your Supabase URL and Service Role Key:
// SUPABASE_URL=your_supabase_url
// SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
//
// Run the script from the project root using: node scripts/seedKnowledgeBase.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') }); // Ensure .env from root is loaded
const { createClient } = require('@supabase/supabase-js');
const { assignmentTopics } = require('../src/data/centralData'); // Adjust path if necessary

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

/**
 * @typedef {object} Topic
 * @property {string} id - Kebab-case ID
 * @property {string} label
 * @property {string} response
 * @property {Topic[]} [subTopics]
 */

/**
 * @typedef {object} DBTopicRecord
 * @property {string} id
 * @property {string} label
 * @property {string} response
 * @property {string | null} parent_id
 * @property {number} sort_order
 */

/**
 * Flattens the hierarchical topic structure for database insertion.
 * @param {Topic[]} topics - Array of topic objects.
 * @param {string | null} parentId - The ID of the parent topic.
 * @param {number} [startingOrder=0] - The starting sort order for siblings.
 * @returns {DBTopicRecord[]} - A flat array of records for the database.
 */
function flattenTopics(topics, parentId, startingOrder = 0) {
  let flattenedRecords = [];
  if (!topics || topics.length === 0) {
    return [];
  }

  topics.forEach((topic, index) => {
    if (!topic.id || !topic.label || topic.response === undefined) {
        console.warn(`Skipping topic due to missing id, label, or response: ${JSON.stringify(topic)}`);
        return;
    }
    const dbRecord = {
      id: topic.id,
      label: topic.label,
      response: topic.response,
      parent_id: parentId,
      sort_order: startingOrder + index,
      // created_at and updated_at will be set by Supabase
    };
    flattenedRecords.push(dbRecord);

    if (topic.subTopics && topic.subTopics.length > 0) {
      flattenedRecords = flattenedRecords.concat(
        flattenTopics(topic.subTopics, topic.id, 0) // Reset startingOrder for children of a new parent
      );
    }
  });
  return flattenedRecords;
}

async function seedKnowledgeBase() {
  console.log("Starting knowledge base seeding process...");

  if (!assignmentTopics || assignmentTopics.length === 0) {
    console.log("No topics found in centralData.ts. Exiting.");
    return;
  }

  const recordsToUpsert = flattenTopics(assignmentTopics, null);

  if (recordsToUpsert.length === 0) {
    console.log("No valid records to upsert after flattening. Exiting.");
    return;
  }

  console.log(`Prepared ${recordsToUpsert.length} records for upsertion.`);
  // console.log("Sample records:", JSON.stringify(recordsToUpsert.slice(0, 2), null, 2));


  try {
    // Upsert the records into the knowledge_base_topics table
    // onConflict: 'id' means if a topic with the same 'id' exists, it will be updated.
    const { data, error } = await supabaseAdmin
      .from('knowledge_base_topics')
      .upsert(recordsToUpsert, { onConflict: 'id' })
      .select(); // Select to get results back for logging

    if (error) {
      console.error('Error upserting knowledge base topics:', error);
      throw error;
    }

    console.log(`Successfully upserted ${data ? data.length : 0} records into knowledge_base_topics.`);
    if (data && data.length < recordsToUpsert.length) {
        console.warn(`Some records may not have been upserted if their parent_id did not resolve correctly during a partial upsert. Total prepared: ${recordsToUpsert.length}, total upserted by this batch: ${data.length}`);
    }

  } catch (error) {
    console.error('Failed to seed knowledge base:', error);
  } finally {
    console.log("Knowledge base seeding process complete.");
  }
}

seedKnowledgeBase().catch(console.error);
