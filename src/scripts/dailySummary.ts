
import dayjs from 'dayjs';
import { getLogsFromStorage } from '@/utils/appendCsv';
import { getTodaysVisitorLogs } from '@/utils/csvHelpers';

export interface DailySummaryData {
  date: string;
  edobEntries: any[];
  incidents: any[];
  visitors: any[];
  shiftLogs: any[];
  noShowAlerts: any[];
}

// Get OpenAI API key from environment (if available)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const generateDailySummary = async (): Promise<string> => {
  const today = dayjs().format('YYYY-MM-DD');
  const todayDisplay = dayjs().format('dddd, MMMM D, YYYY');
  
  console.log(`Generating daily summary for ${today}...`);
  
  // Load all data sources for today
  const summaryData = await loadTodaysData(today);
  
  let summaryText: string;
  
  if (OPENAI_API_KEY) {
    try {
      summaryText = await generateGPTSummary(summaryData, todayDisplay);
    } catch (error) {
      console.warn('GPT-4 generation failed, using fallback template:', error);
      summaryText = generateFallbackSummary(summaryData, todayDisplay);
    }
  } else {
    console.log('No OpenAI API key found, using fallback template');
    summaryText = generateFallbackSummary(summaryData, todayDisplay);
  }
  
  // Save the summary report
  const reportPath = `reports/summary-${today}.txt`;
  saveSummaryReport(reportPath, summaryText);
  
  console.log('Daily summary saved ✔');
  return summaryText;
};

const loadTodaysData = async (today: string): Promise<DailySummaryData> => {
  // Load EDOB entries (stored in localStorage as JSON)
  const edobEntries = getEdobEntriesForDate(today);
  
  // Load incident reports (if any exist)
  const incidents = getIncidentsForDate(today);
  
  // Load visitor logs for today
  const visitors = getTodaysVisitorLogs();
  
  // Load shift start logs
  const shiftLogs = getLogsFromStorage('logs/shiftStart.csv').filter(log => {
    const logDate = dayjs(log.timestamp).format('YYYY-MM-DD');
    return logDate === today;
  });
  
  // Load no-show alerts
  const noShowAlerts = getNoShowAlertsForDate(today);
  
  return {
    date: today,
    edobEntries,
    incidents,
    visitors,
    shiftLogs,
    noShowAlerts
  };
};

const getEdobEntriesForDate = (date: string): any[] => {
  try {
    const stored = localStorage.getItem('edob-entries');
    if (!stored) return [];
    
    const entries = JSON.parse(stored);
    return entries.filter((entry: any) => {
      const entryDate = dayjs(entry.timestamp).format('YYYY-MM-DD');
      return entryDate === date;
    });
  } catch (error) {
    console.warn('No EDOB entries found:', error);
    return [];
  }
};

const getIncidentsForDate = (date: string): any[] => {
  try {
    const stored = localStorage.getItem('incident-reports');
    if (!stored) return [];
    
    const incidents = JSON.parse(stored);
    return incidents.filter((incident: any) => {
      const incidentDate = dayjs(incident.date).format('YYYY-MM-DD');
      return incidentDate === date;
    });
  } catch (error) {
    console.warn('No incident reports found:', error);
    return [];
  }
};

const getNoShowAlertsForDate = (date: string): any[] => {
  try {
    const stored = localStorage.getItem('logs/noShowAlerts.csv');
    if (!stored) return [];
    
    const alerts = JSON.parse(stored);
    return alerts.filter((alert: any) => {
      const alertDate = dayjs(alert.alertTime).format('YYYY-MM-DD');
      return alertDate === date;
    });
  } catch (error) {
    console.warn('No no-show alerts found:', error);
    return [];
  }
};

const generateGPTSummary = async (data: DailySummaryData, dateDisplay: string): Promise<string> => {
  const prompt = `Write a concise security shift summary for ${dateDisplay} covering the following data:

EDOB ENTRIES (${data.edobEntries.length} total):
${data.edobEntries.map(entry => `- ${entry.type}: ${entry.details} (${dayjs(entry.timestamp).format('HH:mm')})`).join('\n')}

INCIDENTS (${data.incidents.length} total):
${data.incidents.map(incident => `- ${incident.type}: ${incident.description} (${incident.time})`).join('\n')}

VISITORS (${data.visitors.length} total):
${data.visitors.map(visitor => `- ${visitor.visitorName} (${visitor.company}) - In: ${dayjs(visitor.arrivalTime).format('HH:mm')}${visitor.departureTime ? `, Out: ${dayjs(visitor.departureTime).format('HH:mm')}` : ' (Still on-site)'}`).join('\n')}

SHIFT ACTIVITIES (${data.shiftLogs.length} shift starts):
${data.shiftLogs.map(log => `- ${log.guardName} started shift at ${dayjs(log.timestamp).format('HH:mm')}`).join('\n')}

NO-SHOW ALERTS (${data.noShowAlerts.length} total):
${data.noShowAlerts.map(alert => `- ${alert.guardName} failed to check in for ${alert.shiftStartTime} shift`).join('\n')}

Please provide a professional security summary covering:
- Overview of shift activities and patrols completed
- Security incidents and actions taken
- Visitor management summary
- Any outstanding issues or concerns
- Overall security status

Keep it concise but comprehensive, suitable for management review.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: 'You are a professional security manager writing daily shift summaries. Be concise, professional, and focus on key security activities and outcomes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
};

const generateFallbackSummary = (data: DailySummaryData, dateDisplay: string): string => {
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

const saveSummaryReport = (reportPath: string, content: string): void => {
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
