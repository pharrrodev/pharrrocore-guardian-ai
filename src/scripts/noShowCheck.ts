
import dayjs from 'dayjs';
import { loadRotaData } from '@/utils/rotaStore';
import { getLogsFromStorage } from '@/utils/appendCsv';
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
const GRACE_PERIOD_MINUTES = parseInt(process.env.GRACE_PERIOD_MINUTES || '10');

export const checkNoShows = (): NoShowAlert[] => {
  const now = dayjs();
  const alerts: NoShowAlert[] = [];
  
  // Load rota data
  const rotaShifts = loadRotaData();
  
  // Load existing shift start logs (from EDOB)
  const shiftStartLogs: ShiftStartLog[] = getLogsFromStorage('logs/shiftStart.csv').map(log => ({
    id: log.id,
    guardId: log.guardId,
    timestamp: log.timestamp,
    action: log.action
  }));
  
  // Load existing no-show alerts to avoid duplicates
  const existingAlerts: NoShowAlert[] = getNoShowAlerts();
  
  // Check each shift that should have started in the last 10 minutes
  rotaShifts.forEach(shift => {
    const shiftDateTime = dayjs(`${shift.date} ${shift.startTime}`);
    const gracePeriodEnd = shiftDateTime.add(GRACE_PERIOD_MINUTES, 'minute');
    
    // Only check shifts where grace period has ended but not too old (within last hour)
    if (now.isAfter(gracePeriodEnd) && now.isBefore(shiftDateTime.add(1, 'hour'))) {
      
      // Check if guard has logged shift start
      const hasCheckedIn = shiftStartLogs.some(log => {
        const logTime = dayjs(log.timestamp);
        return log.guardId === shift.guardId && 
               logTime.isAfter(shiftDateTime.subtract(5, 'minute')) && // Allow 5 min early
               logTime.isBefore(gracePeriodEnd);
      });
      
      // Check if alert already exists for this shift
      const alertExists = existingAlerts.some(alert => 
        alert.guardId === shift.guardId && 
        alert.date === shift.date && 
        alert.shiftStartTime === shift.startTime
      );
      
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
        
        // Log alert (placeholder for SMS/email notification)
        console.log(`🚨 NO-SHOW ALERT: ${alert.guardName} (${alert.guardId}) failed to check in for shift starting ${alert.shiftStartTime} on ${alert.date}`);
      }
    }
  });
  
  // Save new alerts
  if (alerts.length > 0) {
    saveNoShowAlerts(alerts);
  }
  
  return alerts;
};

export const getNoShowAlerts = (): NoShowAlert[] => {
  try {
    const stored = localStorage.getItem('logs/noShowAlerts.csv');
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
    localStorage.setItem('logs/noShowAlerts.csv', JSON.stringify(combined));
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
