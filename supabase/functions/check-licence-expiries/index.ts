import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import dayjs from 'https://esm.sh/dayjs@1.11.10' // Import dayjs for date calculations

// Load environment variables for Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface SIALicence {
  id: string;
  guard_user_id: string;
  licence_number: string;
  expiry_date: string; // YYYY-MM-DD
  status: string;
}

interface LicenceAlert {
  sia_licence_id: string;
  guard_user_id: string;
  licence_number: string;
  expiry_date: string;
  days_until_expiry: number;
  alert_type: 'Expired' | 'Critical' | 'Warning' | 'Info';
  // alert_generated_at is defaulted by DB
  is_acknowledged: boolean; // Default false
}

serve(async (_req: Request) => {
  // This function is intended to be triggered by a schedule, not direct HTTP requests with complex bodies.
  // However, Supabase invokes scheduled functions via a POST request, so serve is used.
  // We can add a security check here if needed, e.g. a secret in the header if called manually.

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured in function environment.')
    }
    const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    })

    console.log("Starting check-licence-expiries function...")

    // 1. Fetch all 'Active' SIA licences
    const { data: activeLicences, error: fetchError } = await adminSupabase
      .from('sia_licences')
      .select('id, guard_user_id, licence_number, expiry_date, status')
      .eq('status', 'Active');

    if (fetchError) {
      console.error('Error fetching active SIA licences:', fetchError);
      throw fetchError;
    }

    if (!activeLicences || activeLicences.length === 0) {
      console.log('No active SIA licences found to check.');
      return new Response(JSON.stringify({ message: 'No active licences to check.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${activeLicences.length} active licences to check.`);
    const alertsToUpsert: LicenceAlert[] = [];
    const today = dayjs();

    for (const licence of activeLicences) {
      const expiryDate = dayjs(licence.expiry_date);
      const daysUntilExpiry = expiryDate.diff(today, 'day');
      let alertType: LicenceAlert['alert_type'] | null = null;

      if (daysUntilExpiry < 0) {
        alertType = 'Expired';
      } else if (daysUntilExpiry <= 30) { // Critical: 0-30 days
        alertType = 'Critical';
      } else if (daysUntilExpiry <= 60) { // Warning: 31-60 days
        alertType = 'Warning';
      } else if (daysUntilExpiry <= 90) { // Info: 61-90 days (optional)
        alertType = 'Info';
      }

      console.log(`Licence ${licence.licence_number}: Expires on ${licence.expiry_date}, Days until expiry: ${daysUntilExpiry}, Alert type: ${alertType}`);


      if (alertType) {
        alertsToUpsert.push({
          sia_licence_id: licence.id,
          guard_user_id: licence.guard_user_id,
          licence_number: licence.licence_number,
          expiry_date: licence.expiry_date,
          days_until_expiry: daysUntilExpiry,
          alert_type: alertType,
          is_acknowledged: false, // New alerts are not acknowledged
        });
      }
    }

    if (alertsToUpsert.length > 0) {
      console.log(`Found ${alertsToUpsert.length} alerts to generate/update.`);

      // Strategy: Clear old, non-acknowledged alerts for these licences and insert new ones.
      // Or, more robustly, upsert based on sia_licence_id and alert_type, updating days_until_expiry and alert_generated_at.
      // For simplicity here, we'll first delete existing non-acknowledged alerts for the licences that triggered a new alert.
      // Then insert the new ones. This avoids complex upsert logic for alert regeneration.

      const licenceIdsWithNewAlerts = alertsToUpsert.map(a => a.sia_licence_id);
      if (licenceIdsWithNewAlerts.length > 0) {
        const { error: deleteError } = await adminSupabase
          .from('licence_alerts')
          .delete()
          .in('sia_licence_id', licenceIdsWithNewAlerts)
          .eq('is_acknowledged', false); // Only delete unacknowledged alerts

        if (deleteError) {
          console.error('Error clearing old unacknowledged alerts:', deleteError);
          // Proceeding to insert new alerts anyway, as duplicates might be caught by constraints or handled by UI
        } else {
          console.log(`Cleared old unacknowledged alerts for ${licenceIdsWithNewAlerts.length} licences.`);
        }
      }

      const { error: insertError } = await adminSupabase
        .from('licence_alerts')
        .insert(alertsToUpsert);

      if (insertError) {
        console.error('Error inserting licence alerts:', insertError);
        throw insertError;
      }
      console.log(`${alertsToUpsert.length} licence alerts processed and saved.`);
    } else {
      console.log('No new alerts to generate based on current expiries.');
    }

    // Also, update status of licences that are now expired
    const expiredLicences = activeLicences.filter(lic => dayjs(lic.expiry_date).isBefore(today, 'day'));
    if (expiredLicences.length > 0) {
      console.log(`Found ${expiredLicences.length} licences that have expired. Updating status...`);
      for (const licence of expiredLicences) {
        const { error: updateStatusError } = await adminSupabase
          .from('sia_licences')
          .update({ status: 'Expired', updated_at: new Date().toISOString() })
          .eq('id', licence.id);
        if (updateStatusError) {
          console.error(`Error updating status for licence ${licence.id}:`, updateStatusError);
        } else {
          console.log(`Licence ${licence.id} status updated to Expired.`);
        }
      }
    }


    return new Response(
      JSON.stringify({ message: `Licence expiry check completed. ${alertsToUpsert.length} alerts processed.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in check-licence-expiries function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
