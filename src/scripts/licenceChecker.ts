
import dayjs from 'dayjs';
import { appendCSVRow } from '../utils/csvHelpers';

interface LicenceRecord {
  id: string;
  guardId: string;
  guardName: string;
  licenceNumber: string;
  expiresDate: string;
}

interface LicenceAlert {
  id: string;
  guardId: string;
  guardName: string;
  licenceNumber: string;
  expiresDate: string;
  daysLeft: number;
  timestamp: string;
}

export const runLicenceChecker = (): void => {
  console.log('Running licence expiry checker...');
  
  // Load licences from CSV (in real implementation, would read from file)
  const licences = loadLicencesFromCSV();
  
  if (licences.length === 0) {
    console.log('No licence data found');
    return;
  }
  
  const today = dayjs();
  const alertThreshold = today.add(60, 'days');
  const alerts: LicenceAlert[] = [];
  
  // Check each licence for expiry within 60 days
  licences.forEach(licence => {
    const expiryDate = dayjs(licence.expiresDate);
    const daysLeft = expiryDate.diff(today, 'days');
    
    if (expiryDate.isBefore(alertThreshold) || expiryDate.isSame(alertThreshold)) {
      const alert: LicenceAlert = {
        id: licence.id,
        guardId: licence.guardId,
        guardName: licence.guardName,
        licenceNumber: licence.licenceNumber,
        expiresDate: licence.expiresDate,
        daysLeft,
        timestamp: today.toISOString()
      };
      
      alerts.push(alert);
    }
  });
  
  // Save alerts to CSV
  if (alerts.length > 0) {
    alerts.forEach(alert => {
      const alertRow = [
        alert.id,
        alert.guardId,
        alert.guardName,
        alert.licenceNumber,
        alert.expiresDate,
        alert.daysLeft.toString(),
        alert.timestamp
      ];
      
      appendCSVRow('logs/licenceAlerts.csv', alertRow);
    });
    
    console.log(`Licence alerts generated: ${alerts.length} licences expiring within 60 days`);
    console.log(`Alerts saved to logs/licenceAlerts.csv`);
    
    // TODO: Send email notifications to relevant personnel
    // Email functionality placeholder - implement when required
    
  } else {
    console.log('No licence expiry alerts - all licences valid for next 60 days');
  }
};

const loadLicencesFromCSV = (): LicenceRecord[] => {
  try {
    // In real implementation, would read from data/licences.csv
    // For demo purposes, using localStorage simulation
    const stored = localStorage.getItem('data/licences.csv');
    if (!stored) {
      // Create some sample data for demonstration
      const sampleLicences: LicenceRecord[] = [
        {
          id: '1',
          guardId: 'G001',
          guardName: 'John Smith',
          licenceNumber: 'LIC001',
          expiresDate: dayjs().add(45, 'days').format('YYYY-MM-DD')
        },
        {
          id: '2',
          guardId: 'G002',
          guardName: 'Jane Doe',
          licenceNumber: 'LIC002',
          expiresDate: dayjs().add(15, 'days').format('YYYY-MM-DD')
        },
        {
          id: '3',
          guardId: 'G003',
          guardName: 'Mike Johnson',
          licenceNumber: 'LIC003',
          expiresDate: dayjs().add(90, 'days').format('YYYY-MM-DD')
        }
      ];
      
      const csvContent = 'id,guardId,guardName,licenceNumber,expiresDate\n' +
        sampleLicences.map(l => `${l.id},${l.guardId},${l.guardName},${l.licenceNumber},${l.expiresDate}`).join('\n');
      localStorage.setItem('data/licences.csv', csvContent);
      
      return sampleLicences;
    }
    
    const lines = stored.trim().split('\n');
    if (lines.length <= 1) return [];
    
    return lines.slice(1).map(line => {
      const [id, guardId, guardName, licenceNumber, expiresDate] = line.split(',');
      return { id, guardId, guardName, licenceNumber, expiresDate };
    });
    
  } catch (error) {
    console.error('Error loading licences:', error);
    return [];
  }
};

export const getLicenceAlerts = (): LicenceAlert[] => {
  try {
    const stored = localStorage.getItem('logs/licenceAlerts.csv');
    if (!stored) return [];
    
    const lines = stored.trim().split('\n');
    if (lines.length <= 1) return [];
    
    return lines.slice(1).map(line => {
      const [id, guardId, guardName, licenceNumber, expiresDate, daysLeft, timestamp] = line.split(',');
      return {
        id,
        guardId,
        guardName,
        licenceNumber,
        expiresDate,
        daysLeft: parseInt(daysLeft),
        timestamp
      };
    });
  } catch (error) {
    console.error('Error loading licence alerts:', error);
    return [];
  }
};
