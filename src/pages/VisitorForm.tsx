
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, Users, Camera, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitVisitorLog } from "@/api/visitor-log";

const visitorFormSchema = z.object({
  visitorName: z.string().min(1, { message: "Visitor name is required." }),
  company: z.string().min(1, { message: "Company is required." }),
  escort: z.string().min(1, { message: "Escort name is required." }),
  mode: z.enum(["in", "out"], { message: "Please select check-in or check-out." }),
});

type VisitorFormValues = z.infer<typeof visitorFormSchema>;

const VisitorForm = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      visitorName: "",
      company: "",
      escort: "",
      mode: "in",
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo size must be less than 2MB");
        return;
      }
      setPhoto(file);
    }
  };

  async function onSubmit(values: VisitorFormValues) {
    setIsSubmitting(true);
    try {
      const response = await submitVisitorLog({
        visitorName: values.visitorName,
        company: values.company,
        escort: values.escort,
        mode: values.mode,
        photo: photo || undefined,
      });

      if (response.status === 'ok') {
        toast.success(response.message);
        form.reset();
        setPhoto(null);
        // Reset file input
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(response.message || 'Failed to submit visitor log');
      }
    } catch (error) {
      toast.error('An error occurred while submitting the log');
      console.error('Submission error:', error);
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
            <CardTitle className="text-2xl">Visitor Access Log</CardTitle>
            <CardDescription>Record visitor check-in and check-out times.</CardDescription>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Company/Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="escort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escort/Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter escort name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in">Check In</SelectItem>
                          <SelectItem value="out">Check Out</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  {isSubmitting ? "Processing..." : "Submit Entry"}
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
