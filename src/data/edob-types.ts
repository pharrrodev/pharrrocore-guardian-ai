
import { z } from "zod";
import { centralData } from "@/data/centralData";

const assignmentTopics = centralData.assignmentTopics;

export const patrolRoutes = ["Full Patrol", ...(assignmentTopics.find(t => t.id === 'patrol-routes')?.subTopics?.map(st => st.label) || [])];
export const alarmZones = assignmentTopics.find(t => t.id === 'alarm-systems')?.subTopics?.map(st => st.label) || [];
export const equipmentToCheck: { id: string; label: string }[] = assignmentTopics.find(t => t.id === 'equipment-checks')?.subTopics?.map(st => ({ id: st.id, label: st.label })) || [];
export const uniformKitItems: { id: string; label: string }[] = assignmentTopics.find(t => t.id === 'uniform-kit-policy')?.subTopics?.map(st => ({ id: st.id, label: st.label })) || [];

// Dynamic function to get current patrol routes (includes newly added ones)
export const getCurrentPatrolRoutes = () => {
  const currentTopics = centralData.assignmentTopics;
  const patrolRoutesTopics = currentTopics.find(t => t.id === 'patrol-routes');
  
  if (patrolRoutesTopics?.subTopics) {
    return ["Full Patrol", ...patrolRoutesTopics.subTopics.map(st => st.label)];
  }
  
  // Fallback to static routes if no patrol routes found
  return ["Full Patrol", "Alpha Route (Perimeter)", "Bravo Route (Internal - Ground Floor)", "Charlie Route (Internal - Upper Floors)"];
};

export const entryTypes = [
  "Patrol",
  "Incident / Observation",
  "Access Control",
  "Alarm Activation",
];
export const accessTypes = ["Visitor Entry", "Contractor Entry", "Delivery"];
export const alarmTypes = ["Intruder", "Fire", "Panic", "Environmental", "False Alarm"];
export const equipmentStatuses = ["OK", "Needs Attention"];

export const formSchema = z.object({
  entryType: z.string().min(1, { message: "Please select an entry type." }),
  patrolRoute: z.string().optional(),
  details: z.string().optional(),
  accessType: z.string().optional(),
  personName: z.string().optional(),
  company: z.string().optional(),
  alarmZone: z.string().optional(),
  alarmType: z.string().optional(),
  uniformChecklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    confirmed: z.boolean(),
    comment: z.string().optional(),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.entryType === 'Patrol' && (!data.patrolRoute || data.patrolRoute === "")) {
    ctx.addIssue({
      code: "custom",
      path: ["patrolRoute"],
      message: "Patrol route is required for this entry type.",
    });
  }
  if (data.entryType === 'Access Control') {
    if (!data.accessType) ctx.addIssue({ code: 'custom', path: ['accessType'], message: 'Access type is required.' });
    if (!data.personName || data.personName.trim() === "") ctx.addIssue({ code: 'custom', path: ['personName'], message: 'Person name is required.' });
    if (!data.company || data.company.trim() === "") ctx.addIssue({ code: 'custom', path: ['company'], message: 'Company is required.' });
  }
  if (data.entryType === 'Alarm Activation') {
    if (!data.alarmZone) ctx.addIssue({ code: 'custom', path: ['alarmZone'], message: 'Alarm zone is required.' });
    if (!data.alarmType) ctx.addIssue({ code: 'custom', path: ['alarmType'], message: 'Alarm type is required.' });
  }

  // Require details for all types except 'Patrol'
  if (data.entryType && !['Patrol'].includes(data.entryType) && (!data.details || data.details.trim() === '')) {
    ctx.addIssue({
      code: 'custom',
      path: ['details'],
      message: data.entryType === 'Incident / Observation'
          ? 'Incident details are required.'
          : 'Additional details/observations are required for this entry type.',
    });
  }
});

export type FormValues = z.infer<typeof formSchema>;

export type EDOBEntry = {
    id: string;
    timestamp: Date;
    type: string;
    details: string;
    route?: string;
    accessType?: string;
    personName?: string;
    company?: string;
    alarmZone?: string;
    alarmType?: string;
    guardName?: string;
}
