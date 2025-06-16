
// Placeholder for future email reminder functionality
// This would be a scheduled job that runs daily to check for expiring training records

import dayjs from 'dayjs';
import { getExpiringTrainingRecords, getExpiredTrainingRecords } from '@/utils/csvHelpers';

// Future implementation: Email service integration
interface EmailService {
  sendNotification(to: string, subject: string, body: string): Promise<void>;
}

// Future implementation: Notification settings
interface NotificationSettings {
  emailEnabled: boolean;
  reminderDays: number[];
  adminEmail: string;
  guardEmails: Record<string, string>;
}

/**
 * Scheduled job to check for expiring training records and send notifications
 * This should be run daily (e.g., via cron job or scheduled task)
 */
export const checkExpiringTraining = async () => {
  // TODO: Implement email notification system
  console.log('Checking for expiring training records...');
  
  // Get records expiring in the next 30 days
  const expiringRecords = getExpiringTrainingRecords(30);
  
  // Get already expired records
  const expiredRecords = getExpiredTrainingRecords();
  
  console.log(`Found ${expiringRecords.length} records expiring soon`);
  console.log(`Found ${expiredRecords.length} expired records`);
  
  // TODO: Group by guard and send personalized emails
  const guardNotifications = groupRecordsByGuard([...expiringRecords, ...expiredRecords]);
  
  for (const [guardName, records] of Object.entries(guardNotifications)) {
    console.log(`Guard ${guardName} has ${records.length} training records requiring attention`);
    
    // TODO: Send email notification
    // await emailService.sendNotification(
    //   guardEmails[guardName],
    //   'Training Records Notification',
    //   generateEmailBody(records)
    // );
  }
  
  // TODO: Send summary to admin
  if (expiringRecords.length > 0 || expiredRecords.length > 0) {
    console.log('Sending admin summary notification...');
    // await emailService.sendNotification(
    //   adminEmail,
    //   'Training Records Summary',
    //   generateAdminSummary(expiringRecords, expiredRecords)
    // );
  }
};

/**
 * Group training records by guard name
 */
const groupRecordsByGuard = (records: any[]) => {
  return records.reduce((groups, record) => {
    const guardName = record.guardName;
    if (!groups[guardName]) {
      groups[guardName] = [];
    }
    groups[guardName].push(record);
    return groups;
  }, {} as Record<string, any[]>);
};

/**
 * Generate email body for individual guard notifications
 */
const generateEmailBody = (records: any[]): string => {
  // TODO: Create HTML email template
  return `
    Dear Guard,
    
    The following training records require your attention:
    
    ${records.map(record => `
    - ${record.courseName}
      Expires: ${dayjs(record.expiresDate).format('DD/MM/YYYY')}
      Status: ${dayjs(record.expiresDate).isBefore(dayjs()) ? 'EXPIRED' : 'Expiring Soon'}
    `).join('\n')}
    
    Please ensure your training is up to date.
    
    Best regards,
    Security Management
  `;
};

/**
 * Generate admin summary email
 */
const generateAdminSummary = (expiring: any[], expired: any[]): string => {
  // TODO: Create HTML email template with detailed summary
  return `
    Training Records Summary
    
    Expiring Soon (${expiring.length}):
    ${expiring.map(r => `- ${r.guardName}: ${r.courseName} (${dayjs(r.expiresDate).format('DD/MM/YYYY')})`).join('\n')}
    
    Expired (${expired.length}):
    ${expired.map(r => `- ${r.guardName}: ${r.courseName} (${dayjs(r.expiresDate).format('DD/MM/YYYY')})`).join('\n')}
  `;
};

// Export the main function for scheduling
export default checkExpiringTraining;
