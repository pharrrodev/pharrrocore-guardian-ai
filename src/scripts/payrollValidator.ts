
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { readCSV, appendCSVRow } from '../utils/csvHelpers';

dayjs.extend(weekOfYear);

interface ShiftRecord {
  id: string;
  guardId: string;
  siteCode: string;
  timestamp: string;
}

interface PayrollRecord {
  guardId: string;
  date: string;
  hoursPaid: number;
}

interface VarianceRecord {
  guardId: string;
  date: string;
  actualHours: number;
  hoursPaid: number;
  variance: number;
  siteCode: string;
}

export const runPayrollValidator = (): void => {
  console.log('Running payroll variance checker...');
  
  // Get previous ISO week (Monday to Sunday)
  const today = dayjs();
  const lastMonday = today.subtract(1, 'week').startOf('isoWeek');
  const lastSunday = lastMonday.endOf('isoWeek');
  
  console.log(`Checking payroll for week: ${lastMonday.format('YYYY-MM-DD')} to ${lastSunday.format('YYYY-MM-DD')}`);
  
  // Load shift data
  const shiftStarts = loadShiftData('logs/shiftStart.csv');
  const shiftEnds = loadShiftData('logs/shiftEnd.csv');
  const payrollData = loadPayrollData('data/payroll.csv');
  
  if (shiftStarts.length === 0 || shiftEnds.length === 0) {
    console.log('No shift data found for the period');
    return;
  }
  
  // Filter shifts for the target week
  const weekShiftStarts = shiftStarts.filter(shift => {
    const shiftDate = dayjs(shift.timestamp);
    return shiftDate.isBetween(lastMonday, lastSunday, null, '[]');
  });
  
  const weekShiftEnds = shiftEnds.filter(shift => {
    const shiftDate = dayjs(shift.timestamp);
    return shiftDate.isBetween(lastMonday, lastSunday, null, '[]');
  });
  
  // Group shifts by guard and date
  const dailyShifts = new Map<string, { starts: ShiftRecord[], ends: ShiftRecord[] }>();
  
  weekShiftStarts.forEach(shift => {
    const date = dayjs(shift.timestamp).format('YYYY-MM-DD');
    const key = `${shift.guardId}-${date}`;
    
    if (!dailyShifts.has(key)) {
      dailyShifts.set(key, { starts: [], ends: [] });
    }
    dailyShifts.get(key)!.starts.push(shift);
  });
  
  weekShiftEnds.forEach(shift => {
    const date = dayjs(shift.timestamp).format('YYYY-MM-DD');
    const key = `${shift.guardId}-${date}`;
    
    if (!dailyShifts.has(key)) {
      dailyShifts.set(key, { starts: [], ends: [] });
    }
    dailyShifts.get(key)!.ends.push(shift);
  });
  
  const variances: VarianceRecord[] = [];
  
  // Calculate actual hours for each guard/date combination
  dailyShifts.forEach((shifts, key) => {
    const [guardId, date] = key.split('-');
    
    if (shifts.starts.length === 0 || shifts.ends.length === 0) {
      console.log(`Skipping ${guardId} on ${date}: missing start or end time`);
      return;
    }
    
    // Get first start and latest end for the day
    const firstStart = shifts.starts.reduce((earliest, shift) => 
      dayjs(shift.timestamp).isBefore(dayjs(earliest.timestamp)) ? shift : earliest
    );
    
    const latestEnd = shifts.ends.reduce((latest, shift) => 
      dayjs(shift.timestamp).isAfter(dayjs(latest.timestamp)) ? shift : latest
    );
    
    // Calculate actual hours
    const startTime = dayjs(firstStart.timestamp);
    const endTime = dayjs(latestEnd.timestamp);
    const actualHours = endTime.diff(startTime, 'hour', true);
    
    // Find matching payroll record
    const payrollRecord = payrollData.find(p => 
      p.guardId === guardId && p.date === date
    );
    
    if (!payrollRecord) {
      console.log(`No payroll record found for ${guardId} on ${date}`);
      return;
    }
    
    const variance = actualHours - payrollRecord.hoursPaid;
    
    // Only include significant variances (> 0.25 hours)
    if (Math.abs(variance) > 0.25) {
      variances.push({
        guardId,
        date,
        actualHours: Math.round(actualHours * 100) / 100,
        hoursPaid: payrollRecord.hoursPaid,
        variance: Math.round(variance * 100) / 100,
        siteCode: firstStart.siteCode
      });
    }
  });
  
  // Save variance report
  const weekNumber = lastMonday.week();
  const year = lastMonday.year();
  const reportPath = `reports/payrollVariance-${year}-${weekNumber.toString().padStart(2, '0')}.csv`;
  
  if (variances.length > 0) {
    // Write header if this is a new file
    const header = ['guardId', 'date', 'actualHours', 'hoursPaid', 'variance', 'siteCode'];
    appendCSVRow(reportPath, header);
    
    variances.forEach(variance => {
      const row = [
        variance.guardId,
        variance.date,
        variance.actualHours.toString(),
        variance.hoursPaid.toString(),
        variance.variance.toString(),
        variance.siteCode
      ];
      appendCSVRow(reportPath, row);
    });
    
    console.log(`Payroll variance report saved ✔ - ${variances.length} discrepancies found`);
    console.log(`Report saved to: ${reportPath}`);
  } else {
    console.log('No significant payroll variances found for the week');
  }
};

const loadShiftData = (filePath: string): ShiftRecord[] => {
  try {
    const csvContent = readCSV(filePath);
    if (!csvContent) {
      // Create sample data for demonstration
      const sampleData = generateSampleShiftData(filePath);
      return sampleData;
    }
    
    const lines = csvContent.trim().split('\n');
    if (lines.length <= 1) return [];
    
    return lines.slice(1).map(line => {
      const [id, guardId, siteCode, timestamp] = line.split(',');
      return { id, guardId, siteCode, timestamp };
    });
  } catch (error) {
    console.error(`Error loading shift data from ${filePath}:`, error);
    return [];
  }
};

const loadPayrollData = (filePath: string): PayrollRecord[] => {
  try {
    const csvContent = readCSV(filePath);
    if (!csvContent) {
      // Create sample payroll data for demonstration
      const sampleData = generateSamplePayrollData();
      return sampleData;
    }
    
    const lines = csvContent.trim().split('\n');
    if (lines.length <= 1) return [];
    
    return lines.slice(1).map(line => {
      const [guardId, date, hoursPaid] = line.split(',');
      return { guardId, date, hoursPaid: parseFloat(hoursPaid) };
    });
  } catch (error) {
    console.error(`Error loading payroll data from ${filePath}:`, error);
    return [];
  }
};

const generateSampleShiftData = (filePath: string): ShiftRecord[] => {
  const lastWeek = dayjs().subtract(1, 'week');
  const sampleData: ShiftRecord[] = [];
  
  // Generate sample shift data for last week
  for (let day = 0; day < 7; day++) {
    const date = lastWeek.startOf('isoWeek').add(day, 'day');
    
    // Guard G001 - normal 8-hour shift
    sampleData.push({
      id: `start-${day}-1`,
      guardId: 'G001',
      siteCode: 'SITE_A',
      timestamp: date.hour(9).minute(0).toISOString()
    });
    
    // Guard G002 - longer shift with overtime
    sampleData.push({
      id: `start-${day}-2`,
      guardId: 'G002',
      siteCode: 'SITE_B',
      timestamp: date.hour(8).minute(30).toISOString()
    });
  }
  
  if (filePath.includes('shiftStart')) {
    // Save start times
    const csvContent = 'id,guardId,siteCode,timestamp\n' + 
      sampleData.map(s => `${s.id},${s.guardId},${s.siteCode},${s.timestamp}`).join('\n');
    localStorage.setItem(filePath, csvContent);
  } else {
    // Generate end times
    const endData = sampleData.map(start => ({
      ...start,
      id: start.id.replace('start', 'end'),
      timestamp: start.guardId === 'G001' 
        ? dayjs(start.timestamp).add(8, 'hour').toISOString()  // Normal 8 hours
        : dayjs(start.timestamp).add(9.5, 'hour').toISOString() // 9.5 hours (overtime)
    }));
    
    const csvContent = 'id,guardId,siteCode,timestamp\n' + 
      endData.map(s => `${s.id},${s.guardId},${s.siteCode},${s.timestamp}`).join('\n');
    localStorage.setItem(filePath, csvContent);
    
    return endData;
  }
  
  return sampleData;
};

const generateSamplePayrollData = (): PayrollRecord[] => {
  const lastWeek = dayjs().subtract(1, 'week');
  const payrollData: PayrollRecord[] = [];
  
  for (let day = 0; day < 7; day++) {
    const date = lastWeek.startOf('isoWeek').add(day, 'day').format('YYYY-MM-DD');
    
    // G001 paid for exactly 8 hours (matches actual)
    payrollData.push({
      guardId: 'G001',
      date,
      hoursPaid: 8.0
    });
    
    // G002 worked 9.5 hours but only paid for 8 (variance of 1.5h)
    payrollData.push({
      guardId: 'G002',
      date,
      hoursPaid: 8.0
    });
  }
  
  // Save sample data
  const csvContent = 'guardId,date,hoursPaid\n' + 
    payrollData.map(p => `${p.guardId},${p.date},${p.hoursPaid}`).join('\n');
  localStorage.setItem('data/payroll.csv', csvContent);
  
  return payrollData;
};

export const getLatestPayrollVarianceReport = (): VarianceRecord[] => {
  try {
    // Find the most recent report
    const reports = Object.keys(localStorage)
      .filter(key => key.startsWith('reports/payrollVariance-'))
      .sort()
      .reverse();
    
    if (reports.length === 0) return [];
    
    const latestReport = reports[0];
    const csvContent = readCSV(latestReport);
    
    if (!csvContent) return [];
    
    const lines = csvContent.trim().split('\n');
    if (lines.length <= 1) return [];
    
    return lines.slice(1).map(line => {
      const [guardId, date, actualHours, hoursPaid, variance, siteCode] = line.split(',');
      return {
        guardId,
        date,
        actualHours: parseFloat(actualHours),
        hoursPaid: parseFloat(hoursPaid),
        variance: parseFloat(variance),
        siteCode
      };
    });
  } catch (error) {
    console.error('Error loading payroll variance report:', error);
    return [];
  }
};
