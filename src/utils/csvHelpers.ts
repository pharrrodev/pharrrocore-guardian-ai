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

export interface TrainingRecord {
  id: string;
  guardId: string;
  guardName: string;
  courseName: string;
  completedDate: string;
  expiresDate: string;
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

export const parseTrainingCSV = (csvContent: string): TrainingRecord[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length <= 1) return [];
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      id: values[0] || '',
      guardId: values[1] || '',
      guardName: values[2] || '',
      courseName: values[3] || '',
      completedDate: values[4] || '',
      expiresDate: values[5] || ''
    };
  });
};

export const formatTrainingCSVRow = (record: TrainingRecord): string => {
  return [
    record.id,
    record.guardId,
    record.guardName,
    record.courseName,
    record.completedDate,
    record.expiresDate
  ].join(',');
};

export const appendTrainingRecord = (record: Omit<TrainingRecord, 'id' | 'guardId'>) => {
  const id = Date.now().toString();
  const guardId = `GUARD_${id}`;
  
  const trainingRecord: TrainingRecord = {
    id,
    guardId,
    ...record
  };
  
  // In a real implementation, this would append to the CSV file
  // For now, we'll store in localStorage as a simulation
  const existingRecords = getTrainingRecords();
  existingRecords.push(trainingRecord);
  localStorage.setItem('trainingRecords', JSON.stringify(existingRecords));
  
  return trainingRecord;
};

export const getTrainingRecords = (): TrainingRecord[] => {
  try {
    const records = localStorage.getItem('trainingRecords');
    return records ? JSON.parse(records) : [];
  } catch {
    return [];
  }
};

export const getExpiringTrainingRecords = (daysThreshold: number = 30): TrainingRecord[] => {
  const allRecords = getTrainingRecords();
  const thresholdDate = dayjs().add(daysThreshold, 'days');
  
  return allRecords.filter(record => {
    const expiryDate = dayjs(record.expiresDate);
    return expiryDate.isBefore(thresholdDate) && expiryDate.isAfter(dayjs());
  });
};

export const getExpiredTrainingRecords = (): TrainingRecord[] => {
  const allRecords = getTrainingRecords();
  const today = dayjs();
  
  return allRecords.filter(record => {
    const expiryDate = dayjs(record.expiresDate);
    return expiryDate.isBefore(today);
  });
};

// Helper function to append any CSV row (generic)
export const appendCSVRow = (filePath: string, rowData: string[]): void => {
  const csvRow = rowData.join(',');
  console.log(`Appending to ${filePath}: ${csvRow}`);
  
  // In a real implementation, this would append to the actual CSV file
  // For now, just log the operation
};
