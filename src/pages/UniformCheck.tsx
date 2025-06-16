
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uniformKitItems, equipmentToCheck, equipmentStatuses } from "@/data/edob-types";
import { guards } from "@/data/rota-data";

const uniformEquipmentCheckSchema = z.object({
  personName: z.string().min(1, { message: "Guard name is required." }),
  uniformChecklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    confirmed: z.boolean(),
  })),
  equipmentChecklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    status: z.string().min(1, { message: "Status is required." }),
  })),
  additionalComments: z.string().optional(),
});

type UniformEquipmentCheckValues = z.infer<typeof uniformEquipmentCheckSchema>;

const UniformCheck = () => {
  const form = useForm<UniformEquipmentCheckValues>({
    resolver: zodResolver(uniformEquipmentCheckSchema),
    defaultValues: {
      personName: "",
      uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: false })),
      equipmentChecklist: equipmentToCheck.map(item => ({ ...item, status: '' })),
      additionalComments: "",
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
        <CardContent className="p-6 pt-0 h-[calc(80vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col gap-4">
              <FormField 
                control={form.control} 
                name="personName" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guard Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select guard name" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guards.map((guard) => (
                          <SelectItem key={guard.id} value={guard.name}>
                            {guard.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 overflow-hidden">
                {/* Uniform Checklist */}
                <div className="rounded-md border p-4 flex flex-col overflow-hidden">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold tracking-tight">Uniform & Kit Checklist</h3>
                    <p className="text-sm text-muted-foreground">Check all items that are present and in good condition.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-2 pr-2">
                      {uniformFields.map((item, index) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name={`uniformChecklist.${index}.confirmed`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border bg-background/30 p-3">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                  id={`uniform-check-${item.id}`} 
                                />
                              </FormControl>
                              <FormLabel 
                                htmlFor={`uniform-check-${item.id}`} 
                                className="font-normal cursor-pointer text-sm flex-1"
                              >
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Equipment Checklist */}
                <div className="rounded-md border p-4 flex flex-col overflow-hidden">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold tracking-tight">Equipment Checklist</h3>
                    <p className="text-sm text-muted-foreground">Set status for each equipment item.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-2 pr-2">
                      {equipmentFields.map((item, index) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name={`equipmentChecklist.${index}.status`}
                          render={({ field }) => (
                            <FormItem className="rounded-lg border bg-background/30 p-3">
                              <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 mt-1">
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
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Comments */}
              <FormField
                control={form.control}
                name="additionalComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any comments about missing items, issues, or observations..."
                        className="h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">Submit Check</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniformCheck;
