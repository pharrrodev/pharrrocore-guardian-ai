
import { z } from "zod";
import { assignmentTopics } from "@/data/assignmentTopics";

export const patrolRoutes = assignmentTopics.find(t => t.id === 'patrol-routes')?.subTopics?.map(st => st.label) || [];
export const alarmZones = assignmentTopics.find(t => t.id === 'alarm-systems')?.subTopics?.map(st => st.label) || [];
export const equipmentToCheck = assignmentTopics.find(t => t.id === 'equipment-checks')?.subTopics?.map(st => st.label) || [];

export const entryTypes = [
  "Patrol",
  "Incident / Observation",
  "Access Control",
  "Alarm Activation",
  "Equipment Check",
];
export const accessTypes = ["Visitor Entry", "Contractor Entry", "Delivery"];
export const alarmTypes = ["Intruder", "Fire", "Panic", "Environmental"];
export const equipmentStatuses = ["OK", "Needs Attention"];

export const formSchema = z.object({
  entryType: z.string().min(1, { message: "Please select an entry type." }),
  patrolRoute: z.string().optional(),
  details: z.string().min(1, { message: "Details are required." }),
  accessType: z.string().optional(),
  personName: z.string().optional(),
  company: z.string().optional(),
  alarmZone: z.string().optional(),
  alarmType: z.string().optional(),
  equipmentChecked: z.string().optional(),
  equipmentStatus: z.string().optional(),
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
  if (data.entryType === 'Equipment Check') {
    if (!data.equipmentChecked) ctx.addIssue({ code: 'custom', path: ['equipmentChecked'], message: 'Equipment selection is required.' });
    if (!data.equipmentStatus) ctx.addIssue({ code: 'custom', path: ['equipmentStatus'], message: 'Equipment status is required.' });
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
    equipmentChecked?: string;
    equipmentStatus?: string;
}
