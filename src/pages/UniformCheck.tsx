
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { toast } from "sonner";
import { Home, ClipboardCheck, Users, ListChecks } from "lucide-react"; // Added Users, ListChecks

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uniformKitItems } from "@/data/edob-types";
// import { guards } from "@/data/rota-data"; // Remove static import
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import React, { useState, useEffect } from "react"; // Import React hooks

// Define a type for fetched users/guards
interface GuardUser {
  id: string;
  name: string; // This could be email or a display name from metadata
}

const uniformCheckSchema = z.object({
  personName: z.string().min(1, { message: "Guard name is required." }), // This will store the selected guard's name
  uniformChecklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    confirmed: z.boolean(),
  })).min(1, "At least one item must be checked/unchecked."), // Ensure checklist is interacted with
  additionalComments: z.string().optional(),
});

type UniformCheckValues = z.infer<typeof uniformCheckSchema>;

const UniformCheck = () => {
  const [guardUsers, setGuardUsers] = useState<GuardUser[]>([]);
  const [selectedGuardUserId, setSelectedGuardUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGuards, setIsLoadingGuards] = useState(true); // New loading state for guards
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGuards = async () => {
      setIsLoadingGuards(true);
      try {
        // Invoke the Edge Function
        const { data: guardsData, error: functionsError } = await supabase.functions.invoke('get-guard-list');

        if (functionsError) {
          console.error("Error fetching guards via Edge Function:", functionsError);
          toast.error("Failed to load guards list. Please try again later.");
          setGuardUsers([]);
          throw functionsError;
        }

        if (guardsData) {
          // Edge function returns [{id, name, email}]
          // Map to GuardUser interface {id, name}
          const formattedGuards = guardsData.map((g: any) => ({
            id: g.id,
            name: g.name || g.email, // Use name, fallback to email
          }));
          setGuardUsers(formattedGuards);
        } else {
          setGuardUsers([]);
        }
      } catch (err) {
        // Error already handled by toast in the try block or it's an unexpected client-side issue
        console.error("Client-side error in fetchGuards:", err);
        // setGuardUsers([]); // Ensure it's empty on error
      } finally {
        setIsLoadingGuards(false);
      }
    };
    fetchGuards();
  }, []);

  const form = useForm<UniformCheckValues>({
    resolver: zodResolver(uniformCheckSchema),
    defaultValues: {
      personName: "", // This will store the selected guard's name
      uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: true })), // Default all to true
      additionalComments: "",
    },
  });

  const { fields: uniformFields } = useFieldArray({
    control: form.control,
    name: "uniformChecklist",
  });

  const handleGuardSelection = (selectedName: string) => {
    form.setValue("personName", selectedName); // Set the name for the form
    const selectedUser = guardUsers.find(user => user.name === selectedName);
    setSelectedGuardUserId(selectedUser ? selectedUser.id : null);
  };

  async function onSubmit(values: UniformCheckValues) {
    setIsSubmitting(true);
    const { data: { user: checkerUser } } = await supabase.auth.getUser();

    if (!checkerUser) {
      toast.error("You must be logged in to submit a check.");
      setIsSubmitting(false);
      return;
    }

    const checkData = {
      guard_id: selectedGuardUserId, // UUID of the guard if matched, else null
      guard_name_checked: values.personName, // Name string from selection/input
      checker_user_id: checkerUser.id,
      check_timestamp: new Date().toISOString(),
      checklist_items: values.uniformChecklist,
      additional_comments: values.additionalComments || null,
      // site_id: null, // Set if site context is available
    };

    try {
      const { error } = await supabase.from("uniform_checks").insert(checkData);
      if (error) {
        throw error;
      }
      toast.success("Uniform check submitted successfully!", {
        description: `Check for ${values.personName} has been recorded.`,
      });
      form.reset({
        personName: "",
        uniformChecklist: uniformKitItems.map(item => ({ ...item, confirmed: true })),
        additionalComments: "",
      });
      setSelectedGuardUserId(null);
    } catch (error: any) {
      console.error("Error submitting uniform check:", error);
      toast.error(`Failed to submit check: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <ClipboardCheck className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Uniform Check</CardTitle>
            <CardDescription>Perform daily uniform inspection before shift start.</CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/uniform-check-log">
                <ListChecks className="w-4 h-4 mr-2" />
                View Log
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Go to dashboard">
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="personName" // This field receives the selected guard's name string
                render={({ field }) => ( // field.value is the name string
                  <FormItem>
                    <FormLabel>Guard Name</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // field.onChange(value); // This updates personName in react-hook-form
                        handleGuardSelection(value); // This updates our selectedGuardUserId state and also personName
                      }}
                      value={field.value} // Controlled by react-hook-form
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select guard name or type to search" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingGuards ? (
                          <div className="p-4 text-sm text-muted-foreground">Loading guards...</div>
                        ) : guardUsers.length > 0 ? (
                          guardUsers.map((guard) => (
                            <SelectItem key={guard.id} value={guard.name}>
                               <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                                {guard.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground">No guards available or failed to load.</div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Uniform Checklist */}
              <div className="rounded-md border p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold tracking-tight">Uniform & Kit Checklist</h3>
                  <p className="text-sm text-muted-foreground">Check all items that are present and in good condition.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
