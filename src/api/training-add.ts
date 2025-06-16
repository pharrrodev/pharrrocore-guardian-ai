
// Mock API endpoint for adding training records
// In a real implementation, this would be a server-side endpoint

export const addTrainingRecord = async (recordData: {
  guardName: string;
  courseName: string;
  completedDate: string;
  expiresDate: string;
}) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Generate unique ID using timestamp
    const id = Date.now().toString();
    const guardId = `GUARD_${id}`;

    const newRecord = {
      id,
      guardId,
      guardName: recordData.guardName,
      courseName: recordData.courseName,
      completedDate: recordData.completedDate,
      expiresDate: recordData.expiresDate
    };

    // Get existing records from localStorage (simulating CSV file)
    const existingRecords = JSON.parse(localStorage.getItem('trainingRecords') || '[]');
    
    // Check for duplicates
    const isDuplicate = existingRecords.some((record: any) => 
      record.guardName.toLowerCase() === recordData.guardName.toLowerCase() &&
      record.courseName.toLowerCase() === recordData.courseName.toLowerCase() &&
      record.expiresDate === recordData.expiresDate
    );

    if (isDuplicate) {
      return { status: 'error', message: 'Duplicate record' };
    }

    // Add new record
    existingRecords.push(newRecord);
    
    // Save back to localStorage (simulating appending to CSV)
    localStorage.setItem('trainingRecords', JSON.stringify(existingRecords));
    
    console.log(`Training record added: ${newRecord.guardId},${newRecord.guardName},${newRecord.courseName},${newRecord.completedDate},${newRecord.expiresDate}`);
    
    return { status: 'ok', record: newRecord };
  } catch (error) {
    console.error('Error adding training record:', error);
    return { status: 'error', message: 'Failed to add record' };
  }
};
