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
// Run the script from the project root using: node scripts/seedSystemTemplates.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const BOILERPLATE_TEMPLATE_ID = 'tender_boilerplate_v1';
const BOILERPLATE_FILE_PATH = path.resolve(process.cwd(), 'src', 'data', 'bidBoiler.md');

async function seedSystemTemplates() {
  console.log("Starting system templates seeding process...");

  // 1. Read the boilerplate content from bidBoiler.md
  let boilerplateContent;
  try {
    boilerplateContent = fs.readFileSync(BOILERPLATE_FILE_PATH, 'utf8');
    console.log(`Successfully read content from ${BOILERPLATE_FILE_PATH}`);
  } catch (error) {
    console.error(`Error reading boilerplate file at ${BOILERPLATE_FILE_PATH}:`, error.message);
    console.error("Please ensure the file exists and the path is correct relative to the project root.");
    return; // Exit if file cannot be read
  }

  // 2. Prepare the record for upsertion
  const templateRecord = {
    template_id: BOILERPLATE_TEMPLATE_ID,
    content: boilerplateContent,
    description: 'Default boilerplate template for generating tender documents. Contains sections on Company Background, Quality Assurance, Health & Safety, and Professional Standards.',
    // created_at and updated_at will be set by Supabase
  };

  console.log(`Attempting to upsert template with ID: ${BOILERPLATE_TEMPLATE_ID}`);

  try {
    const { data, error } = await supabaseAdmin
      .from('system_templates')
      .upsert(templateRecord, { onConflict: 'template_id' })
      .select();

    if (error) {
      console.error('Error upserting system template:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`Successfully upserted template: ${data[0].template_id}`);
    } else {
      console.warn("Upsert operation completed but returned no data. Check if the record exists in the database.");
    }

  } catch (error) {
    console.error('Failed to seed system templates:', error.message);
  } finally {
    console.log("System templates seeding process complete.");
  }
}

seedSystemTemplates().catch(error => {
  console.error("Unhandled error in seedSystemTemplates:", error);
});
