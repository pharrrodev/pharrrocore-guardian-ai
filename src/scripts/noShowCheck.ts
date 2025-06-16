
import dayjs from 'dayjs';
import { loadRotaData } from '@/utils/rotaStore';
import { guards } from '@/data/rota-data';

export interface NoShowAlert {
  id: string;
  guardId: string;
  guardName: string;
  date: string;
  shiftStartTime: string;
  alertTime: string;
}

export interface ShiftStartLog {
  id: string;
  guardId: string;
  timestamp: string;
  action: string;
}

// Get grace period from environment or default to 10 minutes
const GRACE_PERIOD_MINUTES = parseInt(import.meta.env.VITE_GRACE_PERIOD_MINUTES || '10');

// Helper function to parse CSV data to ShiftStartLog objects
const parseShiftStartLogs = (csvData: string): ShiftStartLog[] => {
  console.log('Raw CSV data:', csvData);
  
  if (!csvData || csvData.trim() === '') {
    console.log('No CSV data found');
    return [];
  }
  
  try {
    const lines = csvData.trim().split('\n');
    console.log('CSV lines:', lines);
    
    if (lines.length <= 1) {
      console.log('No data rows in CSV');
      return [];
    }
    
    // Skip header row and parse each line
    const logs = lines.slice(1).map((line, index) => {
      console.log(`Processing line ${index + 1}:`, line);
      
      const parts = line.split(',');
      if (parts.length < 4) {
        console.warn('Malformed CSV line (too few parts):', line, 'Parts:', parts);
        return null;
      }
      
      const [id, guardId, guardName, action, timestamp] = parts.map(p => p?.trim() || '');
      
      const log = {
        id,
        guardId,
        timestamp,
        action
      };
      
      console.log('Parsed log:', log);
      return log;
    }).filter(log => log !== null && log.action === 'Shift Start') as ShiftStartLog[];
    
    console.log('Filtered shift start logs:', logs);
    return logs;
  } catch (error) {
    console.error('Error parsing shift start logs:', error);
    return [];
  }
};

export const checkNoShows = (): NoShowAlert[] => {
  console.log('=== Starting No-Show Check ===');
  const now = dayjs();
  const alerts: NoShowAlert[] = [];
  
  // Load rota data
  console.log('Loading rota data...');
  const rotaShifts = loadRotaData();
  console.log('Rota shifts loaded:', rotaShifts);
  
  // Load existing shift start logs from localStorage (CSV format)
  let shiftStartLogs: ShiftStartLog[] = [];
  try {
    console.log('Loading shift start logs...');
    const csvData = localStorage.getItem('logs/shiftStart.csv');
    console.log('Raw shift start data from localStorage:', csvData);
    
    if (csvData) {
      shiftStartLogs = parseShiftStartLogs(csvData);
    }
    console.log('Parsed shift start logs:', shiftStartLogs);
  } catch (error) {
    console.error('Error loading shift start logs:', error);
    shiftStartLogs = [];
  }
  
  // Load existing no-show alerts to avoid duplicates
  console.log('Loading existing no-show alerts...');
  const existingAlerts: NoShowAlert[] = getNoShowAlerts();
  console.log('Existing alerts:', existingAlerts);
  
  // Check each shift that should have started in the last 10 minutes
  console.log('Checking shifts for no-shows...');
  rotaShifts.forEach((shift, index) => {
    console.log(`Checking shift ${index + 1}:`, shift);
    
    const shiftDateTime = dayjs(`${shift.date} ${shift.startTime}`);
    const gracePeriodEnd = shiftDateTime.add(GRACE_PERIOD_MINUTES, 'minute');
    
    console.log(`Shift time: ${shiftDateTime.format()}, Grace period ends: ${gracePeriodEnd.format()}, Current time: ${now.format()}`);
    
    // Only check shifts where grace period has ended but not too old (within last hour)
    if (now.isAfter(gracePeriodEnd) && now.isBefore(shiftDateTime.add(1, 'hour'))) {
      console.log('Shift is within check window');
      
      // Check if guard has logged shift start
      const hasCheckedIn = shiftStartLogs.some(log => {
        const logTime = dayjs(log.timestamp);
        const isMatch = log.guardId === shift.guardId && 
               logTime.isAfter(shiftDateTime.subtract(5, 'minute')) && // Allow 5 min early
               logTime.isBefore(gracePeriodEnd);
        
        if (log.guardId === shift.guardId) {
          console.log(`Checking log for ${log.guardId}: ${logTime.format()} vs shift ${shiftDateTime.format()} - Match: ${isMatch}`);
        }
        
        return isMatch;
      });
      
      console.log(`Guard ${shift.guardId} has checked in: ${hasCheckedIn}`);
      
      // Check if alert already exists for this shift
      const alertExists = existingAlerts.some(alert => 
        alert.guardId === shift.guardId && 
        alert.date === shift.date && 
        alert.shiftStartTime === shift.startTime
      );
      
      console.log(`Alert already exists: ${alertExists}`);
      
      if (!hasCheckedIn && !alertExists) {
        const guard = guards.find(g => g.id === shift.guardId);
        const alert: NoShowAlert = {
          id: crypto.randomUUID(),
          guardId: shift.guardId,
          guardName: guard?.name || 'Unknown Guard',
          date: shift.date,
          shiftStartTime: shift.startTime,
          alertTime: now.toISOString()
        };
        
        alerts.push(alert);
        console.log(`🚨 NO-SHOW ALERT CREATED:`, alert);
      }
    } else {
      console.log('Shift outside check window');
    }
  });
  
  // Save new alerts
  if (alerts.length > 0) {
    console.log('Saving new alerts:', alerts);
    saveNoShowAlerts(alerts);
  } else {
    console.log('No new alerts to save');
  }
  
  console.log('=== No-Show Check Complete ===');
  return alerts;
};

export const getNoShowAlerts = (): NoShowAlert[] => {
  try {
    const stored = localStorage.getItem('logs/noShowAlerts.json');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading no-show alerts:', error);
    return [];
  }
};

export const saveNoShowAlerts = (newAlerts: NoShowAlert[]): void => {
  try {
    const existing = getNoShowAlerts();
    const combined = [...existing, ...newAlerts];
    localStorage.setItem('logs/noShowAlerts.json', JSON.stringify(combined));
    console.log(`Saved ${newAlerts.length} new no-show alerts`);
  } catch (error) {
    console.error('Error saving no-show alerts:', error);
  }
};

export const getAlertsLast24Hours = (): NoShowAlert[] => {
  const alerts = getNoShowAlerts();
  const yesterday = dayjs().subtract(24, 'hour');
  
  return alerts.filter(alert => dayjs(alert.alertTime).isAfter(yesterday));
};
