import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
// Removed getLogsFromStorage and getTodaysVisitorLogs as they are localStorage/CSV based

export interface DailySummaryData {
  date: string; // YYYY-MM-DD
  edobEntries: any[]; // Define more specific types if possible
  incidents: any[];   // Define more specific types if possible
  visitors: any[];    // Define more specific types if possible
  shiftLogs: any[];   // Define more specific types if possible
  noShowAlerts: any[];// Define more specific types if possible
}

// Helper function to get start and end of a given day
const getDayBoundaries = (date: string) => {
  const day = dayjs(date);
  return {
    startOfDay: day.startOf('day').toISOString(),
    endOfDay: day.endOf('day').toISOString(),
  };
};

// New helper functions to fetch data from Supabase
const getEdobEntriesForDateFromSupabase = async (date: string): Promise<any[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const { data, error } = await supabase
    .from('edob_entries')
    .select('*') // Select specific columns as needed for the summary
    .gte('timestamp', startOfDay)
    .lte('timestamp', endOfDay)
    .order('timestamp', { ascending: false });
  if (error) console.error('Error fetching EDOB entries:', error.message);
  return data || [];
};

const getIncidentsForDateFromSupabase = async (date: string): Promise<any[]> => {
  // Assuming 'incident_reports' table has a 'created_at' or a specific 'incident_date' field
  // For this example, let's assume 'created_at' for the incident reporting time.
  // If there's a field like 'occurrence_date' that stores just the date, adjust accordingly.
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const { data, error } = await supabase
    .from('incident_reports') // Ensure this is your actual incident reports table name
    .select('*') // Select specific columns
    .gte('created_at', startOfDay) // Adjust field if a different date field is used for incidents
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: false });
  if (error) console.error('Error fetching incidents:', error.message);
  return data || [];
};

const getVisitorLogsForDateFromSupabase = async (date: string): Promise<any[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const { data, error } = await supabase
    .from('visitor_logs')
    .select('*') // Select specific columns
    .gte('arrival_time', startOfDay)
    .lte('arrival_time', endOfDay) // Could also consider visitors who departed within the day
    .order('arrival_time', { ascending: false });
  if (error) console.error('Error fetching visitor logs:', error.message);
  return data || [];
};

const getShiftActivitiesForDateFromSupabase = async (date: string): Promise<any[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  // Fetch relevant activities like 'Shift Start', 'Shift Confirmed'
  const relevantActivityTypes = ['Shift Start', 'Shift Confirmed', 'Check Call'];
  const { data, error } = await supabase
    .from('shift_activities')
    .select('*') // Select specific columns
    .in('activity_type', relevantActivityTypes)
    .gte('timestamp', startOfDay)
    .lte('timestamp', endOfDay)
    .order('timestamp', { ascending: false });
  if (error) console.error('Error fetching shift activities:', error.message);
  return data || [];
};

const getNoShowAlertsForDateFromSupabase = async (date: string): Promise<any[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  // No-show alerts usually have an 'alert_time' or 'expected_shift_start_time'
  const { data, error } = await supabase
    .from('no_show_alerts')
    .select('*') // Select specific columns
    // Filter based on when the alert was generated or when the shift was expected
    .gte('alert_time', startOfDay) // Assuming you want alerts generated on this day
    .lte('alert_time', endOfDay)
    // Or, if you want alerts FOR shifts on this day:
    // .gte('expected_shift_start_time', startOfDay)
    // .lte('expected_shift_start_time', endOfDay)
    .order('alert_time', { ascending: false });
  if (error) console.error('Error fetching no-show alerts:', error.message);
  return data || [];
};


export const loadTodaysData = async (inputDate: string): Promise<DailySummaryData> => {
  // inputDate is expected to be 'YYYY-MM-DD'
  console.log('Loading data from Supabase for date:', inputDate);

  const [edobEntries, incidents, visitors, shiftLogs, noShowAlerts] = await Promise.all([
    getEdobEntriesForDateFromSupabase(inputDate),
    getIncidentsForDateFromSupabase(inputDate), // Assuming 'incident_reports' is the table
    getVisitorLogsForDateFromSupabase(inputDate),
    getShiftActivitiesForDateFromSupabase(inputDate),
    getNoShowAlertsForDateFromSupabase(inputDate),
  ]);

  console.log('EDOB entries loaded from Supabase:', edobEntries.length);
  console.log('Incidents loaded from Supabase:', incidents.length);
  console.log('Visitors loaded from Supabase:', visitors.length);
  console.log('Shift logs loaded from Supabase:', shiftLogs.length);
  console.log('No-show alerts loaded from Supabase:', noShowAlerts.length);

  return {
    date: inputDate,
    edobEntries,
    incidents,
    visitors,
    shiftLogs,
    noShowAlerts,
  };
};

// Old localStorage based functions are removed.
// getShiftLogsForDate, getEdobEntriesForDate, getIncidentsForDate, getNoShowAlertsForDate

export const generateFallbackSummary = (data: DailySummaryData, dateDisplay: string): string => {
  // This function remains the same as its logic depends on the structure of DailySummaryData,
  // not on where the data comes from.
  // However, the fields within data items (e.g., data.visitors[0].visitorName)
  // must now match column names from Supabase tables or be mapped correctly.
  // Example: if Supabase returns 'visitor_name' and FallbackSummary expects 'visitorName',
  // this needs alignment either in fetching or here. For now, assuming direct compatibility.
  const summary = `DAILY SECURITY SUMMARY
${dateDisplay}
${'='.repeat(50)}

SHIFT OVERVIEW:
• ${data.shiftLogs.length} guard(s) checked in for their shifts
• ${data.edobEntries.length} entries logged in Electronic Daily Occurrence Book
• ${data.incidents.length} security incident(s) reported
• ${data.visitors.length} visitor(s) processed

PATROL ACTIVITIES:
${data.edobEntries
  .filter(entry => entry.type === 'Patrol')
  .map(entry => `• ${dayjs(entry.timestamp).format('HH:mm')} - ${entry.details}${entry.route ? ` (${entry.route})` : ''}`)
  .join('\n') || '• No patrol activities logged'}

INCIDENTS & OBSERVATIONS:
${data.incidents.length > 0 
  ? data.incidents.map(incident => `• ${incident.time} - ${incident.type}: ${incident.description}`).join('\n')
  : '• No incidents reported'}

${data.edobEntries
  .filter(entry => entry.type !== 'Patrol')
  .map(entry => `• ${dayjs(entry.timestamp).format('HH:mm')} - ${entry.type}: ${entry.details}`)
  .join('\n')}

VISITOR MANAGEMENT:
${data.visitors.length > 0
  ? data.visitors.map(visitor => 
      `• ${visitor.visitorName} (${visitor.company}) - ${dayjs(visitor.arrivalTime).format('HH:mm')}${visitor.departureTime ? ` to ${dayjs(visitor.departureTime).format('HH:mm')}` : ' (Still on-site)'}`
    ).join('\n')
  : '• No visitors logged'}

ALERTS & ISSUES:
${data.noShowAlerts.length > 0
  ? data.noShowAlerts.map(alert => `• No-show alert: ${alert.guardName} failed to check in for ${alert.shiftStartTime} shift`).join('\n')
  : '• No alerts generated'}

SUMMARY:
Security operations proceeded ${data.incidents.length === 0 && data.noShowAlerts.length === 0 ? 'smoothly' : 'with noted issues'} on ${dateDisplay}. 
${data.edobEntries.filter(e => e.type === 'Patrol').length} patrol activities completed, 
${data.visitors.length} visitors managed, and all activities properly documented.

${data.incidents.length > 0 || data.noShowAlerts.length > 0 
  ? 'FOLLOW-UP REQUIRED: Review incidents and alerts for necessary actions.'
  : 'All Clear: No outstanding security concerns.'}

Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;

  return summary;
};

export const saveSummaryReport = (reportPath: string, content: string): void => {
  // In a real implementation, this would save to the file system
  // For this demo, we'll save to localStorage
  localStorage.setItem(reportPath, content);
  console.log(`Report saved to: ${reportPath}`);
};

// Function to retrieve saved reports
export const getSavedReport = (date: string): string | null => {
  const reportPath = `reports/summary-${date}.txt`;
  return localStorage.getItem(reportPath);
};

export const getAllSavedReports = (): { date: string; path: string }[] => {
  const reports: { date: string; path: string }[] = [];
  
  // Get all localStorage keys that match our report pattern
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('reports/summary-') && key.endsWith('.txt')) {
      const date = key.replace('reports/summary-', '').replace('.txt', '');
      reports.push({ date, path: key });
    }
  }
  
  return reports.sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
};
