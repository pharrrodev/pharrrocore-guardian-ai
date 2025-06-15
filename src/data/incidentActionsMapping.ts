
export const allActions = [
  'Called 999',
  'Called Control Room',
  'Called Site Supervisor',
  'Provided First Aid',
  'Used Defibrillator (AED)',
  'Initiated Building Evacuation',
  'Used Fire Extinguisher',
  'Attempted to De-escalate',
  'Secured Scene',
  'Gathered Witness Information',
  'Checked CCTV',
  'Completed Live Logbook Entry',
  'Other (specify in description)'
];

export const incidentActionsMapping: Record<string, string[]> = {
  'Theft': [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Secured Scene',
    'Gathered Witness Information',
    'Checked CCTV',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Vandalism': [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Secured Scene',
    'Gathered Witness Information',
    'Checked CCTV',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Access Breach': [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Secured Scene',
    'Gathered Witness Information',
    'Checked CCTV',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Disturbance': [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Attempted to De-escalate',
    'Secured Scene',
    'Gathered Witness Information',
    'Checked CCTV',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Medical Emergency': [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Provided First Aid',
    'Used Defibrillator (AED)',
    'Secured Scene',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Fire / Alarm': [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Initiated Building Evacuation',
    'Used Fire Extinguisher',
    'Secured Scene',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Health & Safety': [
    'Called Control Room',
    'Called Site Supervisor',
    'Secured Scene',
    'Gathered Witness Information',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Bomb Threat': [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Initiated Building Evacuation',
    'Secured Scene',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Power Failure': [
    'Called Control Room',
    'Called Site Supervisor',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Equipment Fault': [
    'Called Control Room',
    'Called Site Supervisor',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
  ],
  'Other': allActions,
};
