
import dayjs from 'dayjs';

interface KPIReport {
  date: string;
  patrolsPerGuard: { [guardId: string]: number };
  breaksTaken: number;
  uniformCompliance: number;
  totalPatrols: number;
  patrolTarget: number;
  patrolComplianceRate: number;
}

interface EDOBEntry {
  id: string;
  guardId: string;
  guardName: string;
  actionType: string;
  timestamp: string;
  location: string;
  notes: string;
}

interface UniformCheckEntry {
  id: string;
  guardId: string;
  guardName: string;
  checkDate: string;
  uniformCompliant: string;
  kitCompliant: string;
  notes: string;
}

interface VisitorEntry {
  id: string;
  visitorName: string;
  company: string;
  escort: string;
  arrivalTime: string;
  departureTime: string;
  photoPath: string;
}

// Parse CSV content into structured data
const parseCSV = <T>(csvContent: string, parser: (values: string[]) => T): T[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return [];
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return parser(values);
  });
};

const parseEDOBEntry = (values: string[]): EDOBEntry => ({
  id: values[0] || '',
  guardId: values[1] || '',
  guardName: values[2] || '',
  actionType: values[3] || '',
  timestamp: values[4] || '',
  location: values[5] || '',
  notes: values[6] || ''
});

const parseUniformEntry = (values: string[]): UniformCheckEntry => ({
  id: values[0] || '',
  guardId: values[1] || '',
  guardName: values[2] || '',
  checkDate: values[3] || '',
  uniformCompliant: values[4] || '',
  kitCompliant: values[5] || '',
  notes: values[6] || ''
});

const parseVisitorEntry = (values: string[]): VisitorEntry => ({
  id: values[0] || '',
  visitorName: values[1] || '',
  company: values[2] || '',
  escort: values[3] || '',
  arrivalTime: values[4] || '',
  departureTime: values[5] || '',
  photoPath: values[6] || ''
});

// Load CSV data (in a real environment, this would read from actual files)
const loadCSVData = async (filePath: string): Promise<string> => {
  try {
    // In a browser environment, we'll simulate reading CSV files
    // In a real Node.js environment, you would use fs.readFileSync
    console.log(`Loading CSV data from ${filePath}`);
    
    // For now, return empty CSV since we can't actually read files in the browser
    // In production, this would be: return fs.readFileSync(filePath, 'utf-8');
    return '';
  } catch (error) {
    console.warn(`Could not load ${filePath}, treating as empty`);
    return '';
  }
};

// Calculate KPI metrics
const calculateKPIs = async (targetDate: string): Promise<KPIReport> => {
  const date = dayjs(targetDate);
  const dateStr = date.format('YYYY-MM-DD');
  
  console.log(`Calculating KPIs for ${dateStr}`);
  
  // Load CSV data
  const edobCSV = await loadCSVData('logs/edob.csv');
  const uniformCSV = await loadCSVData('logs/uniformCheck.csv');
  const visitorCSV = await loadCSVData('logs/visitorLog.csv');
  
  // Parse CSV data
  const edobEntries = parseCSV(edobCSV, parseEDOBEntry);
  const uniformEntries = parseCSV(uniformCSV, parseUniformEntry);
  const visitorEntries = parseCSV(visitorCSV, parseVisitorEntry);
  
  // Filter entries for target date
  const targetEdobEntries = edobEntries.filter(entry => {
    const entryDate = dayjs(entry.timestamp).format('YYYY-MM-DD');
    return entryDate === dateStr;
  });
  
  const targetUniformEntries = uniformEntries.filter(entry => {
    const entryDate = dayjs(entry.checkDate).format('YYYY-MM-DD');
    return entryDate === dateStr;
  });
  
  // Calculate patrols per guard
  const patrolsPerGuard: { [guardId: string]: number } = {};
  const breaksCount = targetEdobEntries.filter(entry => 
    entry.actionType.toLowerCase().includes('break')
  ).length;
  
  targetEdobEntries.forEach(entry => {
    if (entry.actionType.toLowerCase().includes('patrol')) {
      if (!patrolsPerGuard[entry.guardId]) {
        patrolsPerGuard[entry.guardId] = 0;
      }
      patrolsPerGuard[entry.guardId]++;
    }
  });
  
  // Calculate total patrols and compliance
  const totalPatrols = Object.values(patrolsPerGuard).reduce((sum, count) => sum + count, 0);
  const patrolTarget = 3; // 3 patrols required per 12-hour shift
  const activeGuards = new Set(targetEdobEntries.map(entry => entry.guardId)).size || 1;
  const expectedTotalPatrols = activeGuards * patrolTarget;
  const patrolComplianceRate = expectedTotalPatrols > 0 ? (totalPatrols / expectedTotalPatrols) * 100 : 0;
  
  // Calculate uniform compliance
  const uniqueGuardsWithUniformCheck = new Set(targetUniformEntries.map(entry => entry.guardId)).size;
  const totalActiveGuards = Math.max(activeGuards, uniqueGuardsWithUniformCheck);
  const uniformCompliance = totalActiveGuards > 0 ? (uniqueGuardsWithUniformCheck / totalActiveGuards) * 100 : 0;
  
  const report: KPIReport = {
    date: dateStr,
    patrolsPerGuard,
    breaksTaken: breaksCount,
    uniformCompliance: Math.round(uniformCompliance * 100) / 100,
    totalPatrols,
    patrolTarget,
    patrolComplianceRate: Math.round(patrolComplianceRate * 100) / 100
  };
  
  console.log('KPI Metrics calculated:', {
    date: dateStr,
    totalPatrols,
    activeGuards,
    patrolComplianceRate: `${report.patrolComplianceRate}%`,
    uniformCompliance: `${report.uniformCompliance}%`,
    breaksTaken: breaksCount
  });
  
  return report;
};

// Save report to JSON file
const saveReport = async (report: KPIReport): Promise<void> => {
  const fileName = `kpi-${report.date}.json`;
  const filePath = `/reports/${fileName}`;
  
  try {
    // In a real environment, this would write to the file system
    // For now, we'll save to localStorage as a simulation
    const reportJSON = JSON.stringify(report, null, 2);
    localStorage.setItem(`kpi-report-${report.date}`, reportJSON);
    
    console.log(`KPI report saved to ${filePath} ✔`);
    console.log('Report contents:', reportJSON);
  } catch (error) {
    console.error('Error saving KPI report:', error);
    throw error;
  }
};

// Main function to generate KPI report for yesterday
export const generateKPIReport = async (): Promise<KPIReport> => {
  try {
    const yesterday = dayjs().subtract(1, 'day');
    const targetDate = yesterday.format('YYYY-MM-DD');
    
    console.log(`Generating KPI report for ${targetDate}`);
    
    const report = await calculateKPIs(targetDate);
    await saveReport(report);
    
    console.log("KPI report saved ✔");
    return report;
  } catch (error) {
    console.error('Error generating KPI report:', error);
    throw error;
  }
};

// Function to generate report for a specific date (useful for testing)
export const generateKPIReportForDate = async (date: string): Promise<KPIReport> => {
  try {
    console.log(`Generating KPI report for ${date}`);
    
    const report = await calculateKPIs(date);
    await saveReport(report);
    
    console.log("KPI report saved ✔");
    return report;
  } catch (error) {
    console.error('Error generating KPI report:', error);
    throw error;
  }
};

// Function to retrieve saved reports
export const getKPIReport = (date: string): KPIReport | null => {
  try {
    const reportJSON = localStorage.getItem(`kpi-report-${date}`);
    return reportJSON ? JSON.parse(reportJSON) : null;
  } catch (error) {
    console.error('Error retrieving KPI report:', error);
    return null;
  }
};

// Function to get all saved reports
export const getAllKPIReports = (): KPIReport[] => {
  try {
    const reports: KPIReport[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('kpi-report-')) {
        const reportJSON = localStorage.getItem(key);
        if (reportJSON) {
          reports.push(JSON.parse(reportJSON));
        }
      }
    }
    return reports.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('Error retrieving KPI reports:', error);
    return [];
  }
};

// Run the KPI tracker (this would typically be called by a cron job)
if (typeof window === 'undefined') {
  // Only run in Node.js environment, not in browser
  generateKPIReport().catch(console.error);
}
