
import dayjs from 'dayjs';

export interface VisitorLogEntry {
  id: string;
  visitorName: string;
  company: string;
  escort: string;
  arrivalTime: string;
  departureTime: string;
  photoPath: string;
}

export const parseCSV = (csvContent: string): VisitorLogEntry[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      id: values[0] || '',
      visitorName: values[1] || '',
      company: values[2] || '',
      escort: values[3] || '',
      arrivalTime: values[4] || '',
      departureTime: values[5] || '',
      photoPath: values[6] || ''
    };
  });
};

export const formatCSVRow = (entry: Partial<VisitorLogEntry>): string => {
  return [
    entry.id || '',
    entry.visitorName || '',
    entry.company || '',
    entry.escort || '',
    entry.arrivalTime || '',
    entry.departureTime || '',
    entry.photoPath || ''
  ].join(',');
};

export const appendVisitorLog = (entry: Omit<VisitorLogEntry, 'departureTime' | 'photoPath'> & { photoPath?: string }) => {
  const logEntry: VisitorLogEntry = {
    ...entry,
    departureTime: '',
    photoPath: entry.photoPath || ''
  };
  
  // In a real implementation, this would write to the CSV file
  // For now, we'll store in localStorage as a simulation
  const existingLogs = getVisitorLogs();
  existingLogs.push(logEntry);
  localStorage.setItem('visitorLogs', JSON.stringify(existingLogs));
  
  return logEntry;
};

export const updateVisitorDeparture = (visitorName: string, departureTime: string) => {
  const logs = getVisitorLogs();
  const entryIndex = logs.findIndex(log => 
    log.visitorName.toLowerCase() === visitorName.toLowerCase() && 
    !log.departureTime
  );
  
  if (entryIndex !== -1) {
    logs[entryIndex].departureTime = departureTime;
    localStorage.setItem('visitorLogs', JSON.stringify(logs));
    return logs[entryIndex];
  }
  
  return null;
};

export const getVisitorLogs = (): VisitorLogEntry[] => {
  try {
    const logs = localStorage.getItem('visitorLogs');
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
};

export const getTodaysVisitorLogs = (): VisitorLogEntry[] => {
  const allLogs = getVisitorLogs();
  const today = dayjs().format('YYYY-MM-DD');
  
  return allLogs.filter(log => {
    const logDate = dayjs(log.arrivalTime).format('YYYY-MM-DD');
    return logDate === today;
  });
};
