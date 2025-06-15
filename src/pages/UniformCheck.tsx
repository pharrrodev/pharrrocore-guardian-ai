
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { uniformKitItems } from "@/data/edob-types";

const uniformCheckSchema = z.object({
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
});

type UniformCheckValues = z.infer<typeof uniformCheckSchema>;

const UniformCheck = () => {
  const form = useForm<UniformCheckValues>({
    resolver: zodResolver(uniformCheckSchema),
    defaultValues: {
      personName: "",
      uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: false, comment: '' }))
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "uniformChecklist",
  });

  function onSubmit(values: UniformCheckValues) {
    console.log(values);
    toast.success("Uniform check submitted successfully!", {
      description: `Check for ${values.personName} has been recorded.`,
    });
    form.reset();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center gap-4">
          <ClipboardCheck className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Uniform & Kit Check</CardTitle>
            <CardDescription>Perform daily uniform and kit inspection before shift start.</CardDescription>
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
                <h3 className="text-base font-semibold tracking-tight">Uniform & Kit Checklist</h3>
                <p className="text-sm text-muted-foreground">Confirm each item. Add a comment for any issues.</p>
                <ScrollArea className="h-72 pr-4 -mr-4">
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

export default UniformCheck;

