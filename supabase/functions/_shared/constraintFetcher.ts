// supabase/functions/_shared/constraintFetcher.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import dayjs from 'https://esm.sh/dayjs@1.11.10'
import isBetween from 'https://esm.sh/dayjs@1.11.10/plugin/isBetween'

dayjs.extend(isBetween)

// --- Interface Definitions ---

// Base profile type that might be extended or used
export interface Profile {
  id: string; // auth.users.id
  guard_name?: string | null;
  role?: string | null;
  // other profile fields if needed
}

export interface ProfileWithConstraints extends Profile {
  availability_preferences?: any | null; // JSONB
  max_hours_per_week?: number | null;
  skill_certifications?: string[] | null;
}

export interface TimeOffRecord {
  id: string;
  user_id: string; // guard_user_id
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason?: string | null;
  status: 'pending' | 'approved' | 'declined';
}

export interface ShiftRequirementRecord {
  id: string;
  site_id: string;
  required_skill: string;
  required_licence?: string | null;
  notes?: string | null;
}

export interface ShiftRecord {
  id: string;
  guard_id: string;
  guard_name: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  position: string;
  shift_type: 'Day' | 'Night' | 'Evening';
  break_times?: Array<{ breakStart: string; breakEnd: string; breakType?: string }> | null;
  site_id?: string | null;
}

export interface SiaLicenceRecord {
  id: string;
  guard_user_id: string;
  licence_number: string;
  licence_type: string;
  issue_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  status: string; // e.g., Active, Expired
}

export interface TrainingRecordData {
  id: string;
  guard_user_id: string | null;
  guard_name_recorded: string;
  course_name: string;
  completed_date: string; // YYYY-MM-DD
  expiry_date: string;    // YYYY-MM-DD
  certificate_url?: string | null;
}

export interface ConstraintData {
  guards: ProfileWithConstraints[];
  approvedTimeOff: TimeOffRecord[];
  siteShiftRequirements: ShiftRequirementRecord[];
  existingShiftsInRange: ShiftRecord[];
  activeSiaLicences: SiaLicenceRecord[];
  validTrainingRecords: TrainingRecordData[];
}

// --- Private Helper Functions ---

async function fetchGuardProfiles(client: SupabaseClient): Promise<ProfileWithConstraints[]> {
  console.log("Fetching guard profiles...");
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, guard_name, role, availability_preferences, max_hours_per_week, skill_certifications')
      .eq('role', 'guard'); // Fetch only users with 'guard' role

    if (error) throw error;
    console.log(`Fetched ${data?.length || 0} guard profiles.`);
    return data || [];
  } catch (error) {
    console.error('Error fetching guard profiles:', error.message);
    return []; // Return empty array on error
  }
}

async function fetchApprovedTimeOff(client: SupabaseClient, dateRange: { startDate: string, endDate: string }): Promise<TimeOffRecord[]> {
  console.log(`Fetching approved time off requests between ${dateRange.startDate} and ${dateRange.endDate}...`);
  try {
    const { data, error } = await client
      .from('time_off_requests')
      .select('*')
      .eq('status', 'approved')
      // Filter for requests that overlap with the dateRange
      // A request overlaps if its start is before or on range_end AND its end is after or on range_start
      .lte('start_date', dateRange.endDate)
      .gte('end_date', dateRange.startDate);

    if (error) throw error;
    console.log(`Fetched ${data?.length || 0} approved time off requests.`);
    return data || [];
  } catch (error) {
    console.error('Error fetching approved time off:', error.message);
    return [];
  }
}

async function fetchSiteShiftRequirements(client: SupabaseClient, siteId: string): Promise<ShiftRequirementRecord[]> {
  console.log(`Fetching shift requirements for site ID: ${siteId}...`);
  try {
    const { data, error } = await client
      .from('shift_requirements')
      .select('*')
      .eq('site_id', siteId);

    if (error) throw error;
    console.log(`Fetched ${data?.length || 0} shift requirements for site ${siteId}.`);
    return data || [];
  } catch (error) {
    console.error('Error fetching site shift requirements:', error.message);
    return [];
  }
}

async function fetchExistingShifts(client: SupabaseClient, dateRange: { startDate: string, endDate: string }, siteId: string): Promise<ShiftRecord[]> {
  console.log(`Fetching existing shifts for site ID: ${siteId} between ${dateRange.startDate} and ${dateRange.endDate}...`);
  try {
    const { data, error } = await client
      .from('shifts')
      .select('*')
      .eq('site_id', siteId)
      .gte('shift_date', dateRange.startDate)
      .lte('shift_date', dateRange.endDate);

    if (error) throw error;
    console.log(`Fetched ${data?.length || 0} existing shifts for site ${siteId} in range.`);
    return data || [];
  } catch (error) {
    console.error('Error fetching existing shifts:', error.message);
    return [];
  }
}

async function fetchActiveSiaLicences(client: SupabaseClient, currentDate: string): Promise<SiaLicenceRecord[]> {
  console.log(`Fetching active SIA licences valid on or after ${currentDate}...`);
  try {
    const { data, error } = await client
      .from('sia_licences')
      .select('*')
      .eq('status', 'Active') // Ensure the licence status itself is 'Active'
      .gte('expiry_date', currentDate); // And not expired

    if (error) throw error;
    console.log(`Fetched ${data?.length || 0} active SIA licences.`);
    return data || [];
  } catch (error) {
    console.error('Error fetching active SIA licences:', error.message);
    return [];
  }
}

async function fetchValidTrainingRecords(client: SupabaseClient, currentDate: string): Promise<TrainingRecordData[]> {
  console.log(`Fetching valid training records valid on or after ${currentDate}...`);
  try {
    const { data, error } = await client
      .from('training_records')
      .select('*')
      .gte('expiry_date', currentDate); // Not expired

    if (error) throw error;
    console.log(`Fetched ${data?.length || 0} valid training records.`);
    return data || [];
  } catch (error) {
    console.error('Error fetching valid training records:', error.message);
    return [];
  }
}


// --- Main Exported Function ---
export async function fetchAllConstraints(
  supabaseClient: SupabaseClient,
  dateRange: { startDate: string, endDate: string }, // YYYY-MM-DD
  siteId: string
): Promise<ConstraintData> {
  console.log(`Fetching all constraints for site ${siteId} and date range ${dateRange.startDate} to ${dateRange.endDate}`);

  const currentDate = dayjs().format('YYYY-MM-DD'); // For filtering active licences/training

  // Perform all data fetching concurrently
  const [
    guards,
    approvedTimeOff,
    siteShiftRequirements,
    existingShiftsInRange,
    activeSiaLicences,
    validTrainingRecords
  ] = await Promise.all([
    fetchGuardProfiles(supabaseClient),
    fetchApprovedTimeOff(supabaseClient, dateRange),
    fetchSiteShiftRequirements(supabaseClient, siteId),
    fetchExistingShifts(supabaseClient, dateRange, siteId),
    fetchActiveSiaLicences(supabaseClient, currentDate),
    fetchValidTrainingRecords(supabaseClient, currentDate)
  ]);

  return {
    guards,
    approvedTimeOff,
    siteShiftRequirements,
    existingShiftsInRange,
    activeSiaLicences,
    validTrainingRecords,
  };
}
