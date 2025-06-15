
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { assignmentTopics } from "@/data/assignmentTopics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const patrolRoutes = assignmentTopics.find(t => t.id === 'patrol-routes')?.subTopics?.map(st => st.label) || [];
const entryTypes = ["Patrol", "General Observation"];

const formSchema = z.object({
  entryType: z.string().min(1, { message: "Please select an entry type." }),
  patrolRoute: z.string().optional(),
  details: z.string().min(1, { message: "Details are required." }),
}).superRefine((data, ctx) => {
  if (data.entryType === 'Patrol' && (!data.patrolRoute || data.patrolRoute === "")) {
    ctx.addIssue({
      code: "custom",
      path: ["patrolRoute"],
      message: "Patrol route is required for this entry type.",
    });
  }
});

type EDOBEntry = {
    id: string;
    timestamp: Date;
    type: string;
    route?: string;
    details: string;
}

const EDOB = () => {
  const [entries, setEntries] = useState<EDOBEntry[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entryType: "",
      patrolRoute: "",
      details: "",
    },
  });
  
  const watchEntryType = form.watch("entryType");

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newEntry: EDOBEntry = {
        id: new Date().toISOString(),
        timestamp: new Date(),
        type: values.entryType,
        details: values.details,
    };
    if (values.entryType === 'Patrol' && values.patrolRoute) {
        newEntry.route = values.patrolRoute;
    }
    setEntries(prev => [newEntry, ...prev]);
    form.reset();
    form.setValue("entryType", "");
    form.setValue("patrolRoute", "");
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details / Observations</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter all relevant details here..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit Entry</Button>
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
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {entries.map(entry => (
                                <Card key={entry.id} className="bg-muted/50">
                                    <CardHeader className="p-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <CheckCircle className="text-green-500" />
                                                {entry.type}
                                            </CardTitle>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(entry.timestamp, "PPP p")}
                                            </div>
                                        </div>
                                        {entry.route && <CardDescription className="pt-1">Route: {entry.route}</CardDescription>}
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="text-sm whitespace-pre-wrap">{entry.details}</p>
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
