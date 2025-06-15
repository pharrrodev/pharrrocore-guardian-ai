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
  {
    id: 'access-control',
    label: 'Access Control',
    response: 'This section details protocols for managing access to the site for visitors, contractors, and deliveries.',
    subTopics: [
      { id: 'visitor-management', label: 'Visitor Management', response: 'All visitors must be pre-registered and sign in at reception. They must be issued a visitor pass and be escorted.'},
      { id: 'contractor-management', label: 'Contractor Management', response: 'Approved contractors are listed in the EDOB system. Verify their identity and work order before granting access.'},
      { id: 'delivery-management', label: 'Delivery Management', response: 'All deliveries must be logged. Inspect packages if protocol requires.'}
    ]
  },
  {
    id: 'alarm-systems',
    label: 'Alarm Systems',
    response: 'The site is equipped with a multi-zone alarm system. Familiarize yourself with the zones and response protocols.',
    subTopics: [
      { id: 'zone-1', label: 'Zone 1 - Main Lab', response: 'Covers all lab areas on the ground floor.' },
      { id: 'zone-2', label: 'Zone 2 - Warehouse Perimeter', response: 'Covers all external doors and windows of the warehouse.' },
      { id: 'zone-3', label: 'Zone 3 - Office Area', response: 'Covers the main office block, including all individual offices.' },
      { id: 'zone-4', label: 'Zone 4 - Server Room', response: 'High-security zone for the server room.' },
    ]
  },
  {
    id: 'equipment-checks',
    label: 'Equipment Checks',
    response: 'Routine checks on key safety and security equipment are mandatory. Please log all checks in the EDOB.',
    subTopics: [
      { id: 'fire-extinguishers', label: 'Fire Extinguishers', response: 'Check pressure gauges and for any visible damage. Ensure they are unobstructed.' },
      { id: 'emergency-exits', label: 'Emergency Exits', response: 'Ensure doors are unlocked and paths are clear of obstructions.' },
      { id: 'cctv-cameras', label: 'CCTV Cameras', response: 'Visually inspect for clear lens and proper orientation. Report any offline cameras.' },
    ]
  }
];
