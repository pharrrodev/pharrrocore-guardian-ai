
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { equipmentToCheck, equipmentStatuses } from "@/data/edob-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const equipmentCheckSchema = z.object({
  personName: z.string().min(1, { message: "Guard name is required." }),
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

type EquipmentCheckValues = z.infer<typeof equipmentCheckSchema>;

const EquipmentCheck = () => {
  const form = useForm<EquipmentCheckValues>({
    resolver: zodResolver(equipmentCheckSchema),
    defaultValues: {
      personName: "",
      equipmentChecklist: equipmentToCheck.map(item => ({ ...item, status: '', comment: '' }))
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "equipmentChecklist",
  });

  function onSubmit(values: EquipmentCheckValues) {
    console.log(values);
    toast.success("Equipment check submitted successfully!", {
      description: `Check for ${values.personName} has been recorded.`,
    });
    form.reset();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center gap-4">
          <ListChecks className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Equipment Check</CardTitle>
            <CardDescription>Perform routine checks on key safety and security equipment.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="icon" className="ml-auto">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="personName" render={({ field }) => (<FormItem><FormLabel>Guard Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="space-y-2 rounded-md border p-4">
                <h3 className="text-base font-semibold tracking-tight">Equipment Checklist</h3>
                <p className="text-sm text-muted-foreground">Set status for each item. Add a comment for any issues.</p>
                <ScrollArea className="h-72 pr-4 -mr-4">
                  <div className="space-y-4 pt-2">
                    {fields.map((item, index) => (
                      <div key={item.id} className="space-y-3 rounded-lg border bg-background/30 p-3">
                        <FormField
                          control={form.control}
                          name={`equipmentChecklist.${index}.status`}
                          render={({ field }) => (
                            <FormItem>
                               <FormLabel className="font-normal">{item.label}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
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
                                <Input placeholder="Add comment if status is 'Needs Attention'..." {...field} className="h-9 text-xs" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Button type="submit" className="w-full">Submit Check</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentCheck;
