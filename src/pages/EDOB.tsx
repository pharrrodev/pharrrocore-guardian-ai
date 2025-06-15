
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { assignmentTopics } from "@/data/assignmentTopics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

const patrolRoutes = assignmentTopics.find(t => t.id === 'patrol-routes')?.subTopics?.map(st => st.label) || [];
const alarmZones = assignmentTopics.find(t => t.id === 'alarm-systems')?.subTopics?.map(st => st.label) || [];
const equipmentToCheck = assignmentTopics.find(t => t.id === 'equipment-checks')?.subTopics?.map(st => st.label) || [];

const entryTypes = [
  "Patrol",
  "Incident / Observation",
  "Access Control",
  "Alarm Activation",
  "Equipment Check",
];
const accessTypes = ["Visitor Entry", "Contractor Entry", "Delivery"];
const alarmTypes = ["Intruder", "Fire", "Panic", "Environmental"];
const equipmentStatuses = ["OK", "Needs Attention"];

const formSchema = z.object({
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

type EDOBEntry = {
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

const EDOB = () => {
  const [entries, setEntries] = useState<EDOBEntry[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entryType: "",
      patrolRoute: "",
      details: "",
      accessType: "",
      personName: "",
      company: "",
      alarmZone: "",
      alarmType: "",
      equipmentChecked: "",
      equipmentStatus: "",
    },
  });
  
  const watchEntryType = form.watch("entryType");

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newEntry: EDOBEntry = {
        id: new Date().toISOString(),
        timestamp: new Date(),
        type: values.entryType,
        details: values.details,
        route: values.entryType === 'Patrol' ? values.patrolRoute : undefined,
        accessType: values.entryType === 'Access Control' ? values.accessType : undefined,
        personName: values.entryType === 'Access Control' ? values.personName : undefined,
        company: values.entryType === 'Access Control' ? values.company : undefined,
        alarmZone: values.entryType === 'Alarm Activation' ? values.alarmZone : undefined,
        alarmType: values.entryType === 'Alarm Activation' ? values.alarmType : undefined,
        equipmentChecked: values.entryType === 'Equipment Check' ? values.equipmentChecked : undefined,
        equipmentStatus: values.entryType === 'Equipment Check' ? values.equipmentStatus : undefined,
    };
    setEntries(prev => [newEntry, ...prev]);
    form.reset();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
          <FileText className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Electronic Daily Occurrence Book (EDOB)</CardTitle>
            <CardDescription>Log all site activities, patrols, and observations.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="icon" className="ml-auto">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 h-full">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">New Entry</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="entryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Type</FormLabel>
                        <Select onValueChange={(value) => { form.reset(); field.onChange(value); }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an entry type..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {entryTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchEntryType === 'Patrol' && (
                     <FormField
                        control={form.control}
                        name="patrolRoute"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Patrol Route</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a patrol route..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {patrolRoutes.map(route => (
                                <SelectItem key={route} value={route}>{route}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                  {watchEntryType === 'Access Control' && (
                    <>
                      <FormField control={form.control} name="accessType" render={({ field }) => (<FormItem><FormLabel>Access Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select access type..." /></SelectTrigger></FormControl><SelectContent>{accessTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="personName" render={({ field }) => (<FormItem><FormLabel>Person's Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="company" render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="e.g., ACME Inc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </>
                  )}
                  {watchEntryType === 'Alarm Activation' && (
                    <>
                      <FormField control={form.control} name="alarmZone" render={({ field }) => (<FormItem><FormLabel>Alarm Zone</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select alarm zone..." /></SelectTrigger></FormControl><SelectContent>{alarmZones.map(zone => (<SelectItem key={zone} value={zone}>{zone}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="alarmType" render={({ field }) => (<FormItem><FormLabel>Alarm Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select alarm type..." /></SelectTrigger></FormControl><SelectContent>{alarmTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </>
                  )}
                   {watchEntryType === 'Equipment Check' && (
                    <>
                      <FormField control={form.control} name="equipmentChecked" render={({ field }) => (<FormItem><FormLabel>Equipment Checked</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select equipment..." /></SelectTrigger></FormControl><SelectContent>{equipmentToCheck.map(item => (<SelectItem key={item} value={item}>{item}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="equipmentStatus" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl><SelectContent>{equipmentStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </>
                  )}
                  {watchEntryType && watchEntryType !== "Incident / Observation" && (
                     <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Additional Details / Observations</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Enter any additional relevant details..."
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                  {watchEntryType === "Incident / Observation" && (
                    <FormField
                      control={form.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incident Details / Observations</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the incident or observation in detail..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {watchEntryType && <Button type="submit">Submit Entry</Button>}
                </form>
              </Form>
            </div>
            <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-4">Logbook</h3>
                <Separator />
                <ScrollArea className="flex-1 -mr-6 pr-6 mt-4">
                    {entries.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No entries logged yet.</p>
                            <p className="text-sm">Use the form on the left to add a new entry.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {entries.map(entry => (
                                <Card key={entry.id} className="bg-muted/50">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <CheckCircle className="text-green-500 w-5 h-5" />
                                                {entry.type}
                                            </CardTitle>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(entry.timestamp, "PPP p")}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        {entry.route && <CardDescription>Route: {entry.route}</CardDescription>}
                                        {entry.accessType && <CardDescription>Access: {entry.accessType} - {entry.personName} ({entry.company})</CardDescription>}
                                        {entry.alarmZone && <CardDescription>Alarm: {entry.alarmType} in {entry.alarmZone}</CardDescription>}
                                        {entry.equipmentChecked && <CardDescription>Equipment Check: {entry.equipmentChecked} - <span className={cn(entry.equipmentStatus === 'OK' ? 'text-green-500' : 'text-orange-500', "font-semibold")}>{entry.equipmentStatus}</span></CardDescription>}
                                        <p className="text-sm whitespace-pre-wrap pt-2">{entry.details}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EDOB;
