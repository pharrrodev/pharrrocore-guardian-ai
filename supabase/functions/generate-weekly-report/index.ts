import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import dayjs from 'https://esm.sh/dayjs@1.11.10'
import weekOfYear from 'https://esm.sh/dayjs@1.11.10/plugin/weekOfYear'
import utc from 'https://esm.sh/dayjs@1.11.10/plugin/utc'
import timezone from 'https://esm.sh/dayjs@1.11.10/plugin/timezone'
// For Markdown to HTML (if attempting PDF via HTML)
// import { marked } from "https://esm.sh/marked@4.0.12"; // Example, check for Deno compatibility/versions
// For PDF generation (highly experimental in Deno, might not work or be too heavy)
// import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"; // Example

dayjs.extend(weekOfYear)
dayjs.extend(utc)
dayjs.extend(timezone)

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const PDF_GENERATION_ENABLED = Deno.env.get('PDF_GENERATION_ENABLED') === 'true' // Control PDF attempt via env var

interface DailySummary {
  summary_date: string;
  content_text: string;
  // other fields if needed
}

interface DailyKpi {
  report_date: string;
  total_patrols: number;
  patrol_target_achieved_percentage: number;
  total_breaks_logged: number;
  uniform_compliance_percentage: number;
  guards_on_duty: number;
  patrols_per_guard_avg?: number | null;
  // other fields if needed
}

// --- Start of Markdown Generation Logic (adapted from weeklyClientReport.ts) ---
function generateMarkdownReportContent(
  weekStartDate: dayjs.Dayjs,
  weekEndDate: dayjs.Dayjs,
  dailySummaries: DailySummary[],
  dailyKpis: DailyKpi[]
): string {
  let markdown = `# Weekly Security Operations Report\n\n`;
  markdown += `**Period:** ${weekStartDate.format('DD MMM YYYY')} - ${weekEndDate.format('DD MMM YYYY')}\n`;
  markdown += `**Generated on:** ${dayjs().format('DD MMM YYYY HH:mm')}\n\n`;

  // 1. Executive Summary (Placeholder - AI could generate this, or manually input later)
  markdown += `## Executive Summary\n`;
  markdown += `This week's operations proceeded [overall status, e.g., "smoothly with all targets met" / "with a few minor incidents noted"]. Key highlights include [mention 1-2 key positive points]. Areas requiring attention are [mention 1-2 key negative points or concerns].\n\n`;

  // 2. KPI Overview
  markdown += `## Key Performance Indicators (KPIs) - Weekly Overview\n`;
  if (dailyKpis.length > 0) {
    const avgPatrols = dailyKpis.reduce((sum, kpi) => sum + (kpi.total_patrols || 0), 0) / dailyKpis.length;
    const avgPatrolTarget = dailyKpis.reduce((sum, kpi) => sum + (kpi.patrol_target_achieved_percentage || 0), 0) / dailyKpis.length;
    const avgUniformCompliance = dailyKpis.reduce((sum, kpi) => sum + (kpi.uniform_compliance_percentage || 0), 0) / dailyKpis.length;
    const totalGuardsOnDutyWeek = dailyKpis.reduce((sum, kpi) => sum + (kpi.guards_on_duty || 0), 0); // Sum of guards each day

    markdown += `- **Average Daily Patrols:** ${avgPatrols.toFixed(1)}\n`;
    markdown += `- **Average Patrol Target Achieved:** ${avgPatrolTarget.toFixed(1)}%\n`;
    markdown += `- **Average Uniform Compliance:** ${avgUniformCompliance.toFixed(1)}%\n`;
    markdown += `- **Total Guard Shifts Covered (sum of guards on duty daily):** ${totalGuardsOnDutyWeek}\n\n`;

    markdown += `### Daily KPI Breakdown:\n`;
    markdown += `| Date       | Patrols | Patrol Target % | Uniform Comp. % | Guards On Duty |\n`;
    markdown += `|------------|---------|-----------------|-----------------|----------------|\n`;
    dailyKpis.sort((a,b) => dayjs(a.report_date).diff(dayjs(b.report_date))).forEach(kpi => {
      markdown += `| ${dayjs(kpi.report_date).format('DD MMM')} | ${kpi.total_patrols} | ${kpi.patrol_target_achieved_percentage.toFixed(1)}% | ${kpi.uniform_compliance_percentage.toFixed(1)}% | ${kpi.guards_on_duty} |\n`;
    });
    markdown += `\n`;
  } else {
    markdown += `No daily KPI data available for this period.\n\n`;
  }

  // 3. Daily Highlights (from generated_daily_summaries)
  markdown += `## Daily Highlights & Summaries\n`;
  if (dailySummaries.length > 0) {
    dailySummaries.sort((a,b) => dayjs(a.summary_date).diff(dayjs(b.summary_date))).forEach(summary => {
      markdown += `### Summary for ${dayjs(summary.summary_date).format('dddd, DD MMM YYYY')}\n`;
      // Extract key points from summary.content_text. This is complex.
      // For now, just include a snippet or first few lines.
      // A more advanced version might look for headings like "Key Incidents" or "Overall Status" within the daily summary.
      const snippet = summary.content_text.split('\n').slice(0, 5).join('\n'); // First 5 lines
      markdown += `${snippet}...\n\n`;
      // markdown += `${summary.content_text}\n\n`; // Or full summary
    });
  } else {
    markdown += `No daily summaries available for this period.\n\n`;
  }

  // 4. Incident Overview (Placeholder - requires fetching from incident_reports or structured data in summaries)
  markdown += `## Incident Overview\n`;
  markdown += `(Details on significant incidents would be listed here. This section requires integration with incident data.)\n\n`;

  markdown += `## Conclusion\n`;
  markdown += `[Overall concluding remarks for the week.]\n\n`;
  return markdown;
}
// --- End of Markdown Generation Logic ---


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

    const requestBody = await req.json().catch(() => ({}));
    const targetWeekStartDateInput = requestBody?.targetWeekStartDate;

    const today = dayjs().tz("Europe/London");
    let weekStartDate: dayjs.Dayjs;

    if (targetWeekStartDateInput) {
      weekStartDate = dayjs(targetWeekStartDateInput).tz("Europe/London").startOf('day');
      if (weekStartDate.day() !== 1) { // Ensure it's a Monday
        // throw new Error("targetWeekStartDate must be a Monday (YYYY-MM-DD).");
         // Or adjust to previous Monday:
        weekStartDate = weekStartDate.day(1);
      }
    } else {
      // Default to the start of the previous week (last Monday)
      weekStartDate = today.subtract(1, 'week').day(1); // .day(1) sets to Monday of that week
    }
    const weekEndDate = weekStartDate.add(6, 'days'); // Sunday

    console.log(`Generating weekly report for period: ${weekStartDate.format('YYYY-MM-DD')} to ${weekEndDate.format('YYYY-MM-DD')}`);

    // Fetch daily summaries for the week
    const { data: dailySummaries, error: summariesError } = await adminSupabase
      .from('generated_daily_summaries')
      .select('summary_date, content_text')
      .gte('summary_date', weekStartDate.format('YYYY-MM-DD'))
      .lte('summary_date', weekEndDate.format('YYYY-MM-DD'));
    if (summariesError) throw summariesError;

    // Fetch daily KPIs for the week
    const { data: dailyKpis, error: kpisError } = await adminSupabase
      .from('daily_kpi_metrics')
      .select('*')
      .gte('report_date', weekStartDate.format('YYYY-MM-DD'))
      .lte('report_date', weekEndDate.format('YYYY-MM-DD'));
    if (kpisError) throw kpisError;

    // Generate Markdown content
    const markdownContent = generateMarkdownReportContent(weekStartDate, weekEndDate, dailySummaries || [], dailyKpis || []);

    const reportFileNameBase = `weekly_client_report_${weekStartDate.format('YYYY')}_W${weekStartDate.week()}`;
    let fileContent: string | Uint8Array = markdownContent;
    let reportType = 'WeeklyClientMarkdown';
    let fileExtension = '.md';
    let contentType = 'text/markdown';

    let pdfGenerationAttempted = false;
    let pdfGenerationSuccess = false;

    if (PDF_GENERATION_ENABLED) {
      pdfGenerationAttempted = true;
      console.log("PDF_GENERATION_ENABLED is true. Attempting PDF generation (placeholder)...");
      // Placeholder for PDF generation attempt
      // e.g., using a library if one was found to be viable.
      // For this subtask, as per plan, this will be a note rather than full implementation
      // due to complexity in Deno Edge Functions.

      // try {
      //   // const htmlContent = marked(markdownContent); // Convert Markdown to HTML
      //   // const browser = await puppeteer.launch({ args: ['--no-sandbox'] }); // Puppeteer is heavy
      //   // const page = await browser.newPage();
      //   // await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      //   // const pdfBuffer = await page.pdf({ format: 'A4' });
      //   // await browser.close();
      //   // fileContent = pdfBuffer;
      //   // reportType = 'WeeklyClientPDF';
      //   // fileExtension = '.pdf';
      //   // contentType = 'application/pdf';
      //   // pdfGenerationSuccess = true;
      //   // console.log("PDF generation successful (simulated).");
      //   throw new Error("PDF generation using Puppeteer/complex libraries not fully implemented in this Edge Function version due to environment constraints.");
      // } catch (pdfError) {
      //   console.warn("PDF generation failed:", pdfError.message, "Falling back to Markdown.");
      //   // Fallback to markdown is default
      // }
       console.warn("PDF generation is enabled in config but not fully implemented in this version due to Deno runtime constraints. Falling back to Markdown.");
    }


    // Upload to Supabase Storage
    const filePath = `client-reports/${reportFileNameBase}${fileExtension}`;
    const { error: storageError } = await adminSupabase.storage
      .from('client-reports') // Bucket name
      .upload(filePath, fileContent, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (storageError) {
      console.error('Error uploading report to storage:', storageError);
      throw storageError;
    }
    console.log(`Report uploaded to: ${filePath}`);

    // Log metadata
    const reportName = `Weekly Client Report - ${weekStartDate.format('YYYY')} Week ${weekStartDate.week()}`;
    const metadataRecord = {
      report_name: reportName,
      report_type: reportType,
      generation_date: new Date().toISOString(),
      period_start_date: weekStartDate.format('YYYY-MM-DD'),
      period_end_date: weekEndDate.format('YYYY-MM-DD'),
      file_storage_path: filePath,
      file_size_bytes: (typeof fileContent === 'string') ? new TextEncoder().encode(fileContent).length : fileContent.byteLength,
      // generated_by_user_id: null, // As it's automated, unless triggered by a specific user via another function
      // site_id: null, // Add if applicable
    };

    const { error: metadataError } = await adminSupabase
      .from('generated_reports_metadata')
      .insert(metadataRecord);

    if (metadataError) {
      console.error('Error logging report metadata:', metadataError);
      throw metadataError;
    }

    let message = `Weekly ${reportType.includes('Markdown') ? 'Markdown' : 'Report'} for ${weekStartDate.format('YYYY-MM-DD')} to ${weekEndDate.format('YYYY-MM-DD')} generated and saved.`;
    if (pdfGenerationAttempted && !pdfGenerationSuccess) {
        message += " PDF generation was attempted but fell back to Markdown."
    }

    return new Response(
      JSON.stringify({ message, filePath, reportType, pdfAttempted: pdfGenerationAttempted, pdfSucceeded: pdfGenerationSuccess }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-weekly-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
