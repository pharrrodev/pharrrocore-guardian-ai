// This script is designed to be run in a Node.js environment.
// Ensure you have `dotenv`, `@supabase/supabase-js`, and `dayjs` installed:
// npm install dotenv @supabase/supabase-js dayjs
// or
// yarn add dotenv @supabase/supabase-js dayjs
//
// Create a .env file in the project root with your Supabase URL and ANON KEY (or SERVICE ROLE KEY):
// SUPABASE_URL=your_supabase_url
// SUPABASE_ANON_KEY=your_supabase_anon_key
// # OR for admin-level invocation if needed, though anon_key is usually fine for invoking functions
// # SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
//
// Run the script from the project root using: node scripts/triggerEdgeFunctions.js

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');

dayjs.extend(isoWeek);

const supabaseUrl = process.env.SUPABASE_URL;
// Use ANON_KEY for invoking functions as an authenticated user (if RLS allows/function handles auth)
// Or SERVICE_ROLE_KEY if functions require admin privileges or are set to bypass RLS for invocation itself.
// For manually triggering admin-like functions, service role key might be simpler here.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: SUPABASE_URL and either SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY must be set in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase client initialized.");

// --- Helper function to invoke an Edge Function ---
async function invokeFunction(functionName, body, description) {
  console.log(`\nInvoking Edge Function: ${functionName} ${description ? `(${description})` : ''}...`);
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    if (error) {
      console.error(`Error invoking ${functionName} ${description || ''}:`, error.message);
      if (error.context) console.error("Error context:", error.context);
      return { success: false, error };
    }
    console.log(`Successfully invoked ${functionName} ${description || ''}. Response:`, data);
    return { success: true, data };
  } catch (e) {
    console.error(`Unexpected error during invocation of ${functionName} ${description || ''}:`, e.message);
    return { success: false, error: e };
  }
}

// --- Main script logic ---
async function triggerDataProcessingFunctions() {
  console.log("Starting manual trigger of data processing Edge Functions...");

  // 1. Trigger `generate-daily-kpis` for the last 7 days
  console.log("\n--- Triggering 'generate-daily-kpis' for the last 7 days ---");
  for (let i = 0; i < 7; i++) {
    const targetDate = dayjs().subtract(i + 1, 'day').format('YYYY-MM-DD'); // +1 to start from yesterday
    await invokeFunction('generate-daily-kpis', { targetDate }, `for date ${targetDate}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
  }

  // 2. Trigger `check-licence-expiries`
  // This function typically doesn't need a specific date body, it checks current state.
  console.log("\n--- Triggering 'check-licence-expiries' ---");
  await invokeFunction('check-licence-expiries', {}, "for current state");
  await new Promise(resolve => setTimeout(resolve, 1000));


  // 3. Trigger `calculate-payroll-variance` for the last 3 typical weekly pay periods
  // Assuming pay periods are Monday-Sunday.
  console.log("\n--- Triggering 'calculate-payroll-variance' for the last 3 pay periods ---");
  for (let i = 0; i < 3; i++) {
    // Calculate start of the week (Monday) for previous weeks
    const targetWeekStartDate = dayjs().subtract(i, 'week').isoWeekday(1).format('YYYY-MM-DD');
    await invokeFunction('calculate-payroll-variance', { targetWeekStartDate }, `for week starting ${targetWeekStartDate}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 4. Trigger `generate-weekly-report` for the last 2 completed weeks
  console.log("\n--- Triggering 'generate-weekly-report' for the last 2 completed weeks ---");
  for (let i = 1; i <= 2; i++) { // Last week (i=1), week before last (i=2)
    const targetWeekStartDate = dayjs().subtract(i, 'week').isoWeekday(1).format('YYYY-MM-DD');
    await invokeFunction('generate-weekly-report', { targetWeekStartDate }, `for week starting ${targetWeekStartDate}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Allow time for report generation
  }

  console.log("\nAll Edge Function invocations attempted.");
  console.log("Please check Supabase logs for each function and the respective database tables for results.");
}

triggerDataProcessingFunctions().catch(error => {
  console.error("Unhandled error in main script execution:", error);
});
