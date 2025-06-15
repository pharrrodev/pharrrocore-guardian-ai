
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  formSchema, 
  FormValues,
  entryTypes,
  patrolRoutes,
  accessTypes,
  alarmZones,
  alarmTypes,
  equipmentToCheck,
  equipmentStatuses,
  uniformKitItems
} from "@/data/edob-types";

interface EDOBFormProps {
  onSubmit: (values: FormValues) => void;
}

const EDOBForm = ({ onSubmit }: EDOBFormProps) => {
  const form = useForm<FormValues>({
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
      uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: false, comment: '' }))
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "uniformChecklist",
  });

  const watchEntryType = form.watch("entryType");

  const handleFormSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset({
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
      uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: false, comment: '' })),
    });
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <h3 className="text-lg font-semibold">New Entry</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-1 flex-col gap-4">
          <ScrollArea className="flex-1 -mr-6 pr-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="entryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Type</FormLabel>
                    <Select onValueChange={(value) => {
                        form.reset({
                          entryType: value,
                          patrolRoute: "",
                          details: "",
                          accessType: "",
                          personName: "",
                          company: "",
                          alarmZone: "",
                          alarmType: "",
                          equipmentChecked: "",
                          equipmentStatus: "",
                          uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: false, comment: '' })),
                        });
                      }} value={field.value}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="personName" render={({ field }) => (<FormItem><FormLabel>Person's Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="company" render={({ field }) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input placeholder="e.g., ACME Inc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
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
              {watchEntryType === 'Uniform Check' && (
                <>
                  <FormField control={form.control} name="personName" render={({ field }) => (<FormItem><FormLabel>Guard Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="space-y-2 rounded-md border p-4">
                    <h4 className="text-base font-semibold tracking-tight">Uniform & Kit Checklist</h4>
                    <p className="text-sm text-muted-foreground">Confirm each item. Add a comment for any issues.</p>
                    <div className="space-y-4 pt-2">
                      {fields.map((item, index) => (
                        <div key={item.id} className="space-y-3 rounded-lg border bg-background/30 p-3">
                          <FormField
                            control={form.control}
                            name={`uniformChecklist.${index}.confirmed`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id={`check-${item.id}`} />
                                </FormControl>
                                <FormLabel htmlFor={`check-${item.id}`} className="font-normal cursor-pointer">{item.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`uniformChecklist.${index}.comment`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Add comment if not confirmed..." {...field} className="h-9 text-xs" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {watchEntryType && !['Incident / Observation', 'Uniform Check'].includes(watchEntryType) && (
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
            </div>
          </ScrollArea>
          {watchEntryType && <Button type="submit">Submit Entry</Button>}
        </form>
      </Form>
    </div>
  );
};

export default EDOBForm;
