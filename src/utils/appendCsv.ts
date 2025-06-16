
import dayjs from 'dayjs';

export interface RadioHandoverLogEntry {
  id: string;
  guardId: string;
  guardName: string;
  timestamp: string;
  action: 'radio' | 'handover';
}

// In a real app, this would write to an actual CSV file
// For now, we'll use localStorage to simulate persistent storage
export const appendCsvLine = (filePath: string, entry: Omit<RadioHandoverLogEntry, 'id' | 'timestamp'>): RadioHandoverLogEntry => {
  const newEntry: RadioHandoverLogEntry = {
    id: crypto.randomUUID(),
    guardId: entry.guardId,
    guardName: entry.guardName,
    timestamp: dayjs().toISOString(),
    action: entry.action
  };

  // Get existing logs from localStorage
  const existingLogs = getLogsFromStorage(filePath);
  existingLogs.push(newEntry);
  
  // Save back to localStorage
  localStorage.setItem(filePath, JSON.stringify(existingLogs));
  
  console.log(`Radio/Handover Log: ${newEntry.guardId},${newEntry.timestamp},${newEntry.action}`);
  
  return newEntry;
};

export const getLogsFromStorage = (filePath: string): RadioHandoverLogEntry[] => {
  const stored = localStorage.getItem(filePath);
  return stored ? JSON.parse(stored) : [];
};

export const getTodaysLogs = (filePath: string, guardId?: string): RadioHandoverLogEntry[] => {
  const logs = getLogsFromStorage(filePath);
  const today = dayjs().format('YYYY-MM-DD');
  
  return logs.filter(log => {
    const logDate = dayjs(log.timestamp).format('YYYY-MM-DD');
    const matchesDate = logDate === today;
    const matchesGuard = !guardId || log.guardId === guardId;
    return matchesDate && matchesGuard;
  });
};
