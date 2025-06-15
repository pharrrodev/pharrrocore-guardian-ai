
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
    response: 'Patrols are a key responsibility. What about patrols?',
    subTopics: [
      { 
        id: 'patrol-routes', 
        label: 'Patrol Routes', 
        response: 'Designated patrol routes are marked on the map in the main office. Deviations are not permitted without authorization.' 
      },
      { 
        id: 'reporting-observations', 
        label: 'Reporting Observations', 
        response: 'Any unusual activity must be reported immediately to the shift supervisor via radio.' 
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
];
