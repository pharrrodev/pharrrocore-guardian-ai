
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uniformKitItems, equipmentToCheck, equipmentStatuses } from "@/data/edob-types";

const uniformEquipmentCheckSchema = z.object({
  personName: z.string().min(1, { message: "Guard name is required." }),
  uniformChecklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    confirmed: z.boolean(),
    comment: z.string().optional(),
  })).superRefine((data, ctx) => {
    data.forEach((item, index) => {
      if (!item.confirmed && (!item.comment || item.comment.trim() === '')) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'comment'],
          message: "Comment required if not confirmed.",
        });
      }
    });
  }),
  equipmentChecklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    status: z.string().min(1, { message: "Status is required." }),
    comment: z.string().optional(),
  })).superRefine((data, ctx) => {
    data.forEach((item, index) => {
      if (item.status === 'Needs Attention' && (!item.comment || item.comment.trim() === '')) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'comment'],
          message: "Comment required if status is 'Needs Attention'.",
        });
      }
    });
  }),
});

type UniformEquipmentCheckValues = z.infer<typeof uniformEquipmentCheckSchema>;

const UniformCheck = () => {
  const form = useForm<UniformEquipmentCheckValues>({
    resolver: zodResolver(uniformEquipmentCheckSchema),
    defaultValues: {
      personName: "",
      uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: false, comment: '' })),
      equipmentChecklist: equipmentToCheck.map(item => ({ ...item, status: '', comment: '' }))
    },
  });

  const { fields: uniformFields } = useFieldArray({
    control: form.control,
    name: "uniformChecklist",
  });

  const { fields: equipmentFields } = useFieldArray({
    control: form.control,
    name: "equipmentChecklist",
  });

  function onSubmit(values: UniformEquipmentCheckValues) {
    console.log(values);
    toast.success("Uniform & equipment check submitted successfully!", {
      description: `Check for ${values.personName} has been recorded.`,
    });
    form.reset();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[80vh]">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <ClipboardCheck className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Uniform & Equipment Check</CardTitle>
            <CardDescription>Perform daily uniform and equipment inspection before shift start.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="icon" className="ml-auto">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="h-full overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
              <FormField control={form.control} name="personName" render={({ field }) => (<FormItem className="mb-4"><FormLabel>Guard Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
                {/* Uniform Checklist */}
                <div className="space-y-2 rounded-md border p-4 flex flex-col overflow-hidden">
                  <h3 className="text-base font-semibold tracking-tight">Uniform & Kit Checklist</h3>
                  <p className="text-sm text-muted-foreground">Confirm each item. Add a comment for any issues.</p>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {uniformFields.map((item, index) => (
                        <div key={item.id} className="space-y-2 rounded-lg border bg-background/30 p-3">
                          <FormField
                            control={form.control}
                            name={`uniformChecklist.${index}.confirmed`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id={`uniform-check-${item.id}`} />
                                </FormControl>
                                <FormLabel htmlFor={`uniform-check-${item.id}`} className="font-normal cursor-pointer text-sm">{item.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`uniformChecklist.${index}.comment`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Add comment if not confirmed..." {...field} className="h-8 text-xs" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Equipment Checklist */}
                <div className="space-y-2 rounded-md border p-4 flex flex-col overflow-hidden">
                  <h3 className="text-base font-semibold tracking-tight">Equipment Checklist</h3>
                  <p className="text-sm text-muted-foreground">Set status for each item. Add a comment for any issues.</p>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {equipmentFields.map((item, index) => (
                        <div key={item.id} className="space-y-2 rounded-lg border bg-background/30 p-3">
                          <FormField
                            control={form.control}
                            name={`equipmentChecklist.${index}.status`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Select status..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {equipmentStatuses.map(status => (
                                      <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`equipmentChecklist.${index}.comment`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Add comment if status is 'Needs Attention'..." {...field} className="h-8 text-xs" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-4">Submit Check</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniformCheck;
