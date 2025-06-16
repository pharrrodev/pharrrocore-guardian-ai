
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

// Add dayjs plugins for week handling
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

interface KPIData {
  date: string;
  patrolsPerGuard: { [guardName: string]: number };
  breaksTaken: { [guardName: string]: number };
  uniformCompliance: number;
  totalPatrols: number;
  totalBreaks: number;
  guardsOnDuty: number;
}

interface WeeklyReportData {
  weekRange: string;
  year: number;
  weekNumber: number;
  kpiData: KPIData[];
  summaries: { date: string; content: string }[];
  averageMetrics: {
    avgPatrolsPerDay: number;
    avgUniformCompliance: number;
    avgBreaksPerDay: number;
    totalIncidents: number;
  };
}

export const generateWeeklyClientReport = async (): Promise<string> => {
  const lastMonday = dayjs().isoWeekday(1).subtract(1, 'week');
  const lastSunday = lastMonday.add(6, 'days');
  const year = lastMonday.year();
  const weekNumber = lastMonday.isoWeek();
  
  console.log(`Generating weekly client report for week ${weekNumber} (${lastMonday.format('YYYY-MM-DD')} to ${lastSunday.format('YYYY-MM-DD')})...`);
  
  // Load data for the week
  const weeklyData = await loadWeeklyData(lastMonday, lastSunday, year, weekNumber);
  
  // Generate markdown content
  const markdownContent = generateMarkdownReport(weeklyData);
  
  // Save markdown report
  const mdFilename = `client-weekly-${year}-W${weekNumber.toString().padStart(2, '0')}.md`;
  const mdPath = `reports/${mdFilename}`;
  saveReport(mdPath, markdownContent);
  
  // Generate PDF (simulation - in real implementation would use puppeteer or similar)
  const pdfFilename = `client-weekly-${year}-W${weekNumber.toString().padStart(2, '0')}.pdf`;
  const pdfPath = `reports/${pdfFilename}`;
  generatePDFReport(pdfPath, markdownContent);
  
  console.log('Client report saved ✔');
  return markdownContent;
};

const loadWeeklyData = async (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, year: number, weekNumber: number): Promise<WeeklyReportData> => {
  const kpiData: KPIData[] = [];
  const summaries: { date: string; content: string }[] = [];
  
  // Load data for each day in the week
  for (let day = startDate; day.isSameOrBefore(endDate); day = day.add(1, 'day')) {
    const dateStr = day.format('YYYY-MM-DD');
    
    // Load KPI data
    const kpiJson = loadKPIData(dateStr);
    if (kpiJson) {
      kpiData.push(kpiJson);
    }
    
    // Load daily summary
    const summaryContent = loadDailySummary(dateStr);
    if (summaryContent) {
      summaries.push({ date: dateStr, content: summaryContent });
    }
  }
  
  // Calculate average metrics
  const averageMetrics = calculateAverageMetrics(kpiData, summaries);
  
  return {
    weekRange: `${startDate.format('MMMM D')} - ${endDate.format('MMMM D, YYYY')}`,
    year,
    weekNumber,
    kpiData,
    summaries,
    averageMetrics
  };
};

const loadKPIData = (date: string): KPIData | null => {
  try {
    const kpiPath = `reports/kpi-${date}.json`;
    const stored = localStorage.getItem(kpiPath);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn(`No KPI data found for ${date}:`, error);
    return null;
  }
};

const loadDailySummary = (date: string): string | null => {
  try {
    const summaryPath = `reports/summary-${date}.txt`;
    return localStorage.getItem(summaryPath);
  } catch (error) {
    console.warn(`No summary found for ${date}:`, error);
    return null;
  }
};

const calculateAverageMetrics = (kpiData: KPIData[], summaries: { date: string; content: string }[]): {
  avgPatrolsPerDay: number;
  avgUniformCompliance: number;
  avgBreaksPerDay: number;
  totalIncidents: number;
} => {
  if (kpiData.length === 0) {
    return { avgPatrolsPerDay: 0, avgUniformCompliance: 0, avgBreaksPerDay: 0, totalIncidents: 0 };
  }
  
  const totalPatrols = kpiData.reduce((sum, day) => sum + (day.totalPatrols || 0), 0);
  const totalBreaks = kpiData.reduce((sum, day) => sum + (day.totalBreaks || 0), 0);
  const avgCompliance = kpiData.reduce((sum, day) => sum + (day.uniformCompliance || 0), 0) / kpiData.length;
  
  // Count incidents from summaries (simple heuristic)
  const totalIncidents = summaries.reduce((count, summary) => {
    const incidentMatches = (summary.content.match(/incident/gi) || []).length;
    return count + Math.min(incidentMatches, 5); // Cap at 5 per day to avoid over-counting
  }, 0);
  
  return {
    avgPatrolsPerDay: Math.round((totalPatrols / kpiData.length) * 10) / 10,
    avgUniformCompliance: Math.round(avgCompliance * 10) / 10,
    avgBreaksPerDay: Math.round((totalBreaks / kpiData.length) * 10) / 10,
    totalIncidents
  };
};

const generateMarkdownReport = (data: WeeklyReportData): string => {
  const { weekRange, year, weekNumber, kpiData, summaries, averageMetrics } = data;
  
  return `# Weekly Security Report
**Week ${weekNumber}, ${year}**  
**Period:** ${weekRange}

---

## Executive Summary

This report covers security operations for the week of ${weekRange}. Our security team maintained consistent patrol schedules, monitored facility access, and responded to ${averageMetrics.totalIncidents} incidents during this period.

### Key Performance Indicators
- **Average Patrols per Day:** ${averageMetrics.avgPatrolsPerDay}
- **Uniform Compliance Rate:** ${averageMetrics.avgUniformCompliance}%
- **Average Breaks per Day:** ${averageMetrics.avgBreaksPerDay}
- **Total Incidents Logged:** ${averageMetrics.totalIncidents}

---

## Daily KPI Breakdown

| Date | Patrols | Breaks | Uniform Compliance | Guards on Duty |
|------|---------|--------|-------------------|----------------|
${kpiData.map(day => 
  `| ${dayjs(day.date).format('MMM DD')} | ${day.totalPatrols || 0} | ${day.totalBreaks || 0} | ${day.uniformCompliance || 0}% | ${day.guardsOnDuty || 0} |`
).join('\n')}

---

## Incident Highlights

${summaries.length > 0 ? summaries.map(summary => {
  const date = dayjs(summary.date).format('dddd, MMMM D');
  const excerpts = extractIncidentExcerpts(summary.content);
  return `### ${date}\n${excerpts || 'No significant incidents reported.'}`;
}).join('\n\n') : 'No incident summaries available for this week.'}

---

## Operational Notes

### Patrol Coverage
${averageMetrics.avgPatrolsPerDay >= 3 
  ? '✅ Patrol frequency meets target requirements (3+ per 12-hour shift).'
  : '⚠️ Patrol frequency below target. Consider increasing patrol rounds.'}

### Compliance Monitoring
${averageMetrics.avgUniformCompliance >= 90 
  ? '✅ Uniform compliance excellent (90%+ target achieved).'
  : '⚠️ Uniform compliance needs improvement. Additional training may be required.'}

### Security Status
Overall security posture remains strong with consistent monitoring and professional response to all incidents.

---

**Report Generated:** ${dayjs().format('MMMM D, YYYY [at] h:mm A')}  
**Security Management System**
`;
};

const extractIncidentExcerpts = (summaryContent: string): string => {
  if (!summaryContent) return '';
  
  // Extract relevant sections that mention incidents, alerts, or issues
  const lines = summaryContent.split('\n');
  const relevantLines = lines.filter(line => 
    line.toLowerCase().includes('incident') ||
    line.toLowerCase().includes('alert') ||
    line.toLowerCase().includes('issue') ||
    line.toLowerCase().includes('reported') ||
    line.includes('•') && (line.toLowerCase().includes('security') || line.toLowerCase().includes('safety'))
  );
  
  return relevantLines.slice(0, 3).join('\n') || 'Routine operations with no significant incidents.';
};

const saveReport = (filePath: string, content: string): void => {
  // Save to localStorage (in real implementation, would save to file system)
  localStorage.setItem(filePath, content);
  console.log(`Markdown report saved to: ${filePath}`);
};

const generatePDFReport = (filePath: string, markdownContent: string): void => {
  // In a real implementation, this would use puppeteer or markdown-pdf
  // For this demo, we'll save a placeholder indicating PDF generation
  const pdfPlaceholder = `PDF Report Generated from Markdown
  
File: ${filePath}
Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}
Content Length: ${markdownContent.length} characters

This would be converted to a professional PDF document using:
- Puppeteer with custom styling
- Or markdown-pdf library
- With proper headers, footers, and branding

Original Markdown Content:
${markdownContent}`;

  localStorage.setItem(filePath, pdfPlaceholder);
  console.log(`PDF report saved to: ${filePath}`);
};

// Function to get all available weekly reports
export const getWeeklyReports = (): { filename: string; path: string; date: string }[] => {
  const reports: { filename: string; path: string; date: string }[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('reports/client-weekly-') && key.endsWith('.pdf')) {
      const filename = key.replace('reports/', '');
      const dateMatch = filename.match(/client-weekly-(\d{4})-W(\d{2})/);
      const dateStr = dateMatch ? `${dateMatch[1]} Week ${parseInt(dateMatch[2])}` : 'Unknown';
      
      reports.push({
        filename,
        path: key,
        date: dateStr
      });
    }
  }
  
  return reports.sort((a, b) => b.filename.localeCompare(a.filename)); // Most recent first
};
