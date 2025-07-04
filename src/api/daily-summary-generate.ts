import dayjs from 'dayjs';

// Define interfaces for expected request and response
interface EdobEntry {
  type: string;
  details: string;
  timestamp: string | Date;
}

interface Incident {
  type: string;
  description: string;
  time: string;
}

interface Visitor {
  visitorName: string;
  company: string;
  arrivalTime: string | Date;
  departureTime?: string | Date;
}

interface ShiftLog {
  guardName: string;
  timestamp: string | Date;
}

interface NoShowAlert {
  guardName: string;
  shiftStartTime: string;
}

interface DailySummaryData {
  date: string;
  edobEntries: EdobEntry[];
  incidents: Incident[];
  visitors: Visitor[];
  shiftLogs: ShiftLog[];
  noShowAlerts: NoShowAlert[];
}

interface GenerateSummaryRequest {
  summaryData: DailySummaryData;
  todayDisplay: string;
}

interface GenerateSummaryResponse {
  summary: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// This function will be called by the API handler
const generateGPTSummaryFromData = async (
  data: DailySummaryData,
  dateDisplay: string,
  apiKey: string,
): Promise<string> => {
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

Based on the data provided above, please generate a professional security summary. Follow the structure and guidelines provided in the system prompt, ensuring all sections are covered.
Pay special attention to accurately populating the 'Key Concerns / Action Items' section if any issues warrant escalation or follow-up.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview', // Updated model
      messages: [
        {
          role: 'system',
          content: `You are a professional security manager tasked with writing comprehensive daily shift summaries.
Your summaries should be clear, concise, and well-structured for management review.
Key guidelines:
1. Structure the summary with clear headings for each section: Overall Status, Critical Incidents, EDOB Highlights, Visitor Summary, Shift Activities, No-Show Alerts, Key Concerns / Action Items.
2. If any section has no data to report (e.g., no incidents), explicitly state this under the relevant heading (e.g., 'No incidents reported during this period.') rather than omitting the section.
3. Ensure any critical incidents, safety concerns, or unresolved issues are highlighted prominently, typically under the 'Key Concerns / Action Items' section. If there are no specific concerns, state 'No specific concerns or action items identified.'
4. Maintain a professional and objective tone.
5. Focus on factual reporting of key security activities and outcomes.`
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
    const errorBody = await response.text();
    console.error(`OpenAI API error: ${response.status}`, errorBody);
    throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
  }

  const result = await response.json();
  const summaryText = result.choices[0]?.message?.content?.trim();

  if (!summaryText) {
    throw new Error('No summary content received from OpenAI');
  }
  return summaryText;
};

// API handler function (e.g., for Next.js, Remix, or a similar framework)
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' } as ErrorResponse), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!openaiKey) {
    console.warn('VITE_OPENAI_API_KEY not configured for the backend.');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured on server' } as ErrorResponse), {
      status: 500, // Or 400 if client should know this is a config issue that might resolve
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { summaryData, todayDisplay } = (await req.json()) as GenerateSummaryRequest;

    if (!summaryData || !todayDisplay) {
      return new Response(JSON.stringify({ error: 'Missing summaryData or todayDisplay in request body' } as ErrorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`API: Generating summary for ${todayDisplay} with data:`, summaryData);

    const summary = await generateGPTSummaryFromData(summaryData, todayDisplay, openaiKey);

    return new Response(JSON.stringify({ summary } as GenerateSummaryResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-summary-generate API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: 'Failed to generate summary', details: errorMessage } as ErrorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
