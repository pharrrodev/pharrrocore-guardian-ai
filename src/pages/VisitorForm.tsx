
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { toast } from "sonner";
import { Home, Users, Camera } from "lucide-react"; // Removed Upload
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Added for visit_purpose
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names

// Updated Zod schema to match new requirements
const visitorFormSchema = z.object({
  visitorName: z.string().min(1, { message: "Visitor name is required." }),
  company: z.string().optional(), // Company is optional as per schema
  visitPurpose: z.string().min(1, { message: "Purpose of visit is required." }),
  personToVisit: z.string().min(1, { message: "Person to visit is required." }),
  vehicleRegistration: z.string().optional(),
});

type VisitorFormValues = z.infer<typeof visitorFormSchema>;

const VisitorForm = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      visitorName: "",
      company: "",
      visitPurpose: "",
      personToVisit: "",
      vehicleRegistration: "",
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo size must be less than 2MB.");
        event.target.value = ''; // Reset file input
        setPhoto(null);
        return;
      }
      setPhoto(file);
    } else {
      setPhoto(null);
    }
  };

  async function onSubmit(values: VisitorFormValues) {
    setIsSubmitting(true);
    let photoUrl: string | null = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to register a visitor.");
        setIsSubmitting(false);
        return;
      }

      // 1. Handle photo upload if a photo is selected
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`; // Unique file name
        const filePath = `public/visitor-photos/${fileName}`; // Define a path, e.g., public/visitor-photos/

        const { error: uploadError } = await supabase.storage
          .from('visitor-photos') // Bucket name
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          toast.error(`Failed to upload photo: ${uploadError.message}`);
          // Decide if you want to proceed without photo or stop
          // For now, we'll stop if photo upload fails and a photo was selected
          setIsSubmitting(false);
          return;
        }

        // Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
          .from('visitor-photos')
          .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            console.error('Error getting public URL for photo');
            toast.error('Failed to get photo URL. Please try again.');
            // Attempt to remove the uploaded file if URL retrieval fails to prevent orphans
            await supabase.storage.from('visitor-photos').remove([filePath]);
            setIsSubmitting(false);
            return;
        }
        photoUrl = urlData.publicUrl;
      }

      // 2. Prepare data for visitor_logs table
      const visitorLogData = {
        visitor_name: values.visitorName,
        company: values.company || null,
        visit_purpose: values.visitPurpose,
        person_to_visit: values.personToVisit,
        vehicle_registration: values.vehicleRegistration || null,
        arrival_time: new Date().toISOString(),
        photo_url: photoUrl,
        user_id_check_in: user.id,
        site_id: null, // Set site_id if available, otherwise null
      };

      // 3. Insert into Supabase table
      const { error: insertError } = await supabase
        .from('visitor_logs')
        .insert([visitorLogData]);

      if (insertError) {
        console.error('Error inserting visitor log:', insertError);
        toast.error(`Failed to submit visitor log: ${insertError.message}`);
        // If photo was uploaded but DB insert fails, try to remove photo to avoid orphans
        if (photoUrl && filePath) {
            await supabase.storage.from('visitor-photos').remove([filePath]);
        }
        throw insertError;
      }

      toast.success("Visitor checked in successfully!");
      form.reset();
      setPhoto(null);
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Optionally navigate to the log page
      // navigate('/visitor-log-today');

    } catch (error) {
      // Errors are handled and toasted above
      console.error('Submission process error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <Users className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Visitor Check-In</CardTitle>
            <CardDescription>Register a new visitor entering the premises.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="icon" className="ml-auto">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="visitorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visitor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter visitor's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Organization (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visitPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Visit</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Scheduled Maintenance, Client Meeting, Delivery" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personToVisit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person to Visit / Host</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name of host or department" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="vehicleRegistration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Registration (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AB12 CDE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Photo Upload */}
              <div className="space-y-2">
                <label htmlFor="photo-upload" className="text-sm font-medium">
                  Visitor Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {photo && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Camera className="w-4 h-4" />
                      Photo selected
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 2MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Processing..." : "Check In Visitor"}
                </Button>
                <Button asChild variant="outline">
                  <Link to="/visitor-log-today">
                    View Today's Log
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorForm;
