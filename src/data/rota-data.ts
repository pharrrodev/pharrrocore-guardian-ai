
export interface Guard {
  id: string;
  name: string;
  position: string;
}

export interface Shift {
  id: string;
  guardId: string;
  guardName: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  position: string;
  shiftType: 'Day' | 'Night' | 'Evening';
  breakTimes: {
    breakStart: string; // HH:mm format
    breakEnd: string; // HH:mm format
    breakType: 'Lunch' | 'Tea Break' | 'Dinner';
  }[];
}

export const guards: Guard[] = [
  { id: 'G001', name: 'John Smith', position: 'Senior Security Officer' },
  { id: 'G002', name: 'Sarah Johnson', position: 'Security Officer' },
  { id: 'G003', name: 'Mike Wilson', position: 'Security Officer' },
  { id: 'G004', name: 'Emma Davis', position: 'Senior Security Officer' },
  { id: 'G005', name: 'Tom Brown', position: 'Security Officer' },
  { id: 'G006', name: 'Lisa Garcia', position: 'Security Officer' },
  { id: 'G007', name: 'James Miller', position: 'Senior Security Officer' },
  { id: 'G008', name: 'Anna Taylor', position: 'Security Officer' },
];

// Generate sample rota data for the next 7 days
const today = new Date();
const generateDate = (daysFromToday: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

export const rotaData: Shift[] = [
  // Day 1
  {
    id: 'S001',
    guardId: 'G001',
    guardName: 'John Smith',
    date: generateDate(0),
    startTime: '06:00',
    endTime: '14:00',
    position: 'Main Entrance',
    shiftType: 'Day',
    breakTimes: [
      { breakStart: '09:00', breakEnd: '09:15', breakType: 'Tea Break' },
      { breakStart: '12:00', breakEnd: '12:30', breakType: 'Lunch' }
    ]
  },
  {
    id: 'S002',
    guardId: 'G002',
    guardName: 'Sarah Johnson',
    date: generateDate(0),
    startTime: '14:00',
    endTime: '22:00',
    position: 'Reception Desk',
    shiftType: 'Evening',
    breakTimes: [
      { breakStart: '17:00', breakEnd: '17:15', breakType: 'Tea Break' },
      { breakStart: '19:00', breakEnd: '19:30', breakType: 'Dinner' }
    ]
  },
  {
    id: 'S003',
    guardId: 'G003',
    guardName: 'Mike Wilson',
    date: generateDate(0),
    startTime: '22:00',
    endTime: '06:00',
    position: 'Patrol Route A',
    shiftType: 'Night',
    breakTimes: [
      { breakStart: '01:00', breakEnd: '01:15', breakType: 'Tea Break' },
      { breakStart: '03:30', breakEnd: '04:00', breakType: 'Dinner' }
    ]
  },
  
  // Day 2
  {
    id: 'S004',
    guardId: 'G004',
    guardName: 'Emma Davis',
    date: generateDate(1),
    startTime: '06:00',
    endTime: '14:00',
    position: 'Car Park',
    shiftType: 'Day',
    breakTimes: [
      { breakStart: '09:30', breakEnd: '09:45', breakType: 'Tea Break' },
      { breakStart: '12:15', breakEnd: '12:45', breakType: 'Lunch' }
    ]
  },
  {
    id: 'S005',
    guardId: 'G005',
    guardName: 'Tom Brown',
    date: generateDate(1),
    startTime: '14:00',
    endTime: '22:00',
    position: 'Main Entrance',
    shiftType: 'Evening',
    breakTimes: [
      { breakStart: '16:30', breakEnd: '16:45', breakType: 'Tea Break' },
      { breakStart: '18:30', breakEnd: '19:00', breakType: 'Dinner' }
    ]
  },
  {
    id: 'S006',
    guardId: 'G006',
    guardName: 'Lisa Garcia',
    date: generateDate(1),
    startTime: '22:00',
    endTime: '06:00',
    position: 'Reception Desk',
    shiftType: 'Night',
    breakTimes: [
      { breakStart: '00:45', breakEnd: '01:00', breakType: 'Tea Break' },
      { breakStart: '03:00', breakEnd: '03:30', breakType: 'Dinner' }
    ]
  },

  // Day 3
  {
    id: 'S007',
    guardId: 'G007',
    guardName: 'James Miller',
    date: generateDate(2),
    startTime: '06:00',
    endTime: '14:00',
    position: 'Patrol Route B',
    shiftType: 'Day',
    breakTimes: [
      { breakStart: '09:15', breakEnd: '09:30', breakType: 'Tea Break' },
      { breakStart: '12:30', breakEnd: '13:00', breakType: 'Lunch' }
    ]
  },
  {
    id: 'S008',
    guardId: 'G008',
    guardName: 'Anna Taylor',
    date: generateDate(2),
    startTime: '14:00',
    endTime: '22:00',
    position: 'Car Park',
    shiftType: 'Evening',
    breakTimes: [
      { breakStart: '17:15', breakEnd: '17:30', breakType: 'Tea Break' },
      { breakStart: '19:15', breakEnd: '19:45', breakType: 'Dinner' }
    ]
  },
  {
    id: 'S009',
    guardId: 'G001',
    guardName: 'John Smith',
    date: generateDate(2),
    startTime: '22:00',
    endTime: '06:00',
    position: 'Main Entrance',
    shiftType: 'Night',
    breakTimes: [
      { breakStart: '01:15', breakEnd: '01:30', breakType: 'Tea Break' },
      { breakStart: '03:45', breakEnd: '04:15', breakType: 'Dinner' }
    ]
  },

  // Day 4
  {
    id: 'S010',
    guardId: 'G002',
    guardName: 'Sarah Johnson',
    date: generateDate(3),
    startTime: '06:00',
    endTime: '14:00',
    position: 'Reception Desk',
    shiftType: 'Day',
    breakTimes: [
      { breakStart: '08:45', breakEnd: '09:00', breakType: 'Tea Break' },
      { breakStart: '11:45', breakEnd: '12:15', breakType: 'Lunch' }
    ]
  },
  {
    id: 'S011',
    guardId: 'G003',
    guardName: 'Mike Wilson',
    date: generateDate(3),
    startTime: '14:00',
    endTime: '22:00',
    position: 'Patrol Route A',
    shiftType: 'Evening',
    breakTimes: [
      { breakStart: '16:45', breakEnd: '17:00', breakType: 'Tea Break' },
      { breakStart: '18:45', breakEnd: '19:15', breakType: 'Dinner' }
    ]
  },
  {
    id: 'S012',
    guardId: 'G004',
    guardName: 'Emma Davis',
    date: generateDate(3),
    startTime: '22:00',
    endTime: '06:00',
    position: 'Car Park',
    shiftType: 'Night',
    breakTimes: [
      { breakStart: '00:30', breakEnd: '00:45', breakType: 'Tea Break' },
      { breakStart: '02:45', breakEnd: '03:15', breakType: 'Dinner' }
    ]
  },

  // Continue pattern for remaining days
  {
    id: 'S013',
    guardId: 'G005',
    guardName: 'Tom Brown',
    date: generateDate(4),
    startTime: '06:00',
    endTime: '14:00',
    position: 'Main Entrance',
    shiftType: 'Day',
    breakTimes: [
      { breakStart: '09:00', breakEnd: '09:15', breakType: 'Tea Break' },
      { breakStart: '12:00', breakEnd: '12:30', breakType: 'Lunch' }
    ]
  },
  {
    id: 'S014',
    guardId: 'G006',
    guardName: 'Lisa Garcia',
    date: generateDate(5),
    startTime: '14:00',
    endTime: '22:00',
    position: 'Reception Desk',
    shiftType: 'Evening',
    breakTimes: [
      { breakStart: '17:00', breakEnd: '17:15', breakType: 'Tea Break' },
      { breakStart: '19:00', breakEnd: '19:30', breakType: 'Dinner' }
    ]
  },
  {
    id: 'S015',
    guardId: 'G007',
    guardName: 'James Miller',
    date: generateDate(6),
    startTime: '22:00',
    endTime: '06:00',
    position: 'Patrol Route B',
    shiftType: 'Night',
    breakTimes: [
      { breakStart: '01:00', breakEnd: '01:15', breakType: 'Tea Break' },
      { breakStart: '03:30', breakEnd: '04:00', breakType: 'Dinner' }
    ]
  }
];

// Helper functions for the break time checker
export const getCurrentShift = (): Shift | null => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
  
  return rotaData.find(shift => {
    if (shift.date !== currentDate) return false;
    
    // Handle overnight shifts
    if (shift.startTime > shift.endTime) {
      return currentTime >= shift.startTime || currentTime <= shift.endTime;
    }
    
    return currentTime >= shift.startTime && currentTime <= shift.endTime;
  }) || null;
};

export const getShiftsByDate = (date: string): Shift[] => {
  return rotaData.filter(shift => shift.date === date);
};

export const getGuardShifts = (guardId: string): Shift[] => {
  return rotaData.filter(shift => shift.guardId === guardId);
};
