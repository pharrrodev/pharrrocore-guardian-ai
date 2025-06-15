export type Topic = {
  id: string;
  label: string;
  response: string;
  subTopics?: Topic[];
};

export const assignmentTopics: Topic[] = [
  {
    id: 'site-access',
    label: 'Site Access Procedures',
    response: 'Site access is strictly controlled. What do you want to know about site access?',
    subTopics: [
      { 
        id: 'gate-entry', 
        label: 'Gate Entry', 
        response: 'All personnel must show valid ID at Gate A. All vehicles are subject to inspection.' 
      },
      { 
        id: 'visitor-policy', 
        label: 'Visitor Policy', 
        response: 'Visitors must be pre-approved 24 hours in advance and must be escorted at all times.' 
      },
    ],
  },
  {
    id: 'patrol-duties',
    label: 'Patrol Duties',
    response: 'Patrols are a key responsibility. This section covers patrol routes and reporting procedures.',
    subTopics: [
      { 
        id: 'patrol-routes-info', 
        label: 'About Patrol Routes', 
        response: 'Designated patrol routes are established for comprehensive site coverage. Guards must adhere to these routes unless directed otherwise by a supervisor. All routes are available as options in the Electronic Daily Occurrence Book (EDOB) when logging a patrol.' 
      },
      { 
        id: 'reporting-observations', 
        label: 'Reporting Observations', 
        response: 'Any unusual activity must be logged in the EDOB immediately. For urgent matters, also report directly to the shift supervisor via radio.' 
      },
    ],
  },
  {
    id: 'patrol-routes',
    label: 'Patrol Routes',
    response: 'The following patrol routes are established for comprehensive site coverage. Please familiarize yourself with them.',
    subTopics: [
      { 
        id: 'alpha-route', 
        label: 'Alpha Route (Perimeter)', 
        response: 'Covers the entire external perimeter fence line, Gate A, and the warehouse loading docks. Duration: 30 minutes.' 
      },
      { 
        id: 'bravo-route', 
        label: 'Bravo Route (Internal - Ground Floor)', 
        response: 'Covers the main lobby, all ground floor corridors, lab access points, and the main office. Duration: 25 minutes.' 
      },
      { 
        id: 'charlie-route', 
        label: 'Charlie Route (Internal - Upper Floors)', 
        response: 'Covers all upper floor corridors, server room exterior, and fire exit stairwells. Duration: 20 minutes.' 
      },
    ],
  },
  {
    id: 'emergency-response',
    label: 'Emergency Response',
    response: 'In case of an emergency, follow the established protocols. Which emergency are you asking about?',
    subTopics: [
      { id: 'fire', label: 'Fire', response: 'In case of fire, activate the nearest alarm, evacuate the building, and assemble at the primary muster point.' },
      { id: 'medical', label: 'Medical Emergency', response: 'For medical emergencies, contact the on-site paramedic at extension 555 and provide your location and the nature of the emergency.' },
    ],
  },
  {
    id: 'contacts',
    label: 'Key Contacts',
    response: 'Here are the key contacts for the site. Who do you need to contact?',
    subTopics: [
      { 
        id: 'supervisor', 
        label: 'Supervisor on Duty', 
        response: 'The supervisor on duty can be reached at 555-123-4567. For non-urgent matters, use the internal radio.' 
      },
      { 
        id: 'site-manager', 
        label: 'Site Manager', 
        response: 'The Site Manager, Jane Doe, can be reached at 555-987-6543 during business hours (9am-5pm, Mon-Fri).' 
      },
      { 
        id: 'emergency-services-contact', 
        label: 'Emergency Services', 
        response: 'For any emergency (Fire, Medical, Police), dial 911 immediately. Then, report to the shift supervisor.' 
      },
    ],
  },
];
