import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { PlusCircle, ArrowLeft, Edit2, Trash2, Users, RefreshCw } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { toast } from 'sonner';

// Types
interface GuardUser {
  id: string;
  name: string;
}

interface SIALicence {
  id: string;
  guard_user_id: string;
  licence_number: string;
  licence_type: string;
  issue_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  status: string;
  created_by_user_id: string;
  created_at: string;
  // Joined data
  guard_user?: { email?: string; user_metadata?: { full_name?: string } };
  created_by_user?: { email?: string; user_metadata?: { full_name?: string } };
}

const licenceFormSchema = z.object({
  guard_user_id: z.string().uuid({ message: "Please select a guard." }),
  licence_number: z.string().min(1, { message: "Licence number is required." }),
  licence_type: z.string().min(1, { message: "Licence type is required." }),
  issue_date: z.date({ required_error: "Issue date is required." }),
  expiry_date: z.date({ required_error: "Expiry date is required." }),
  status: z.string().default('Active'),
}).refine(data => dayjs(data.expiry_date).isAfter(dayjs(data.issue_date)), {
  message: "Expiry date must be after issue date.",
  path: ["expiry_date"],
});

type LicenceFormValues = z.infer<typeof licenceFormSchema>;

const licenceTypes = ["Door Supervisor", "CCTV", "Security Guard", "Close Protection", "Key Holding"];
const licenceStatuses = ["Active", "Expired", "Revoked", "Suspended", "Pending Renewal"];


const ManageLicencesPage = () => {
  const [licences, setLicences] = useState<SIALicence[]>([]);
  const [availableGuards, setAvailableGuards] = useState<GuardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [editingLicence, setEditingLicence] = useState<SIALicence | null>(null); // For Edit functionality later

  const form = useForm<LicenceFormValues>({
    resolver: zodResolver(licenceFormSchema),
    defaultValues: {
      guard_user_id: '',
      licence_number: '',
      licence_type: '',
      issue_date: undefined,
      expiry_date: undefined,
      status: 'Active',
    },
  });

  const fetchGuards = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-guard-list');
      if (error) throw error;
      setAvailableGuards(data.map((g: any) => ({ id: g.id, name: g.name || g.email })) || []);
    } catch (err) {
      console.error("Error fetching guards:", err);
      toast.error("Failed to load guard list.");
    }
  }, []);

  const fetchLicences = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sia_licences')
        .select(`
          *,
          guard_user:guard_user_id ( email, user_metadata ),
          created_by_user:created_by_user_id ( email, user_metadata )
        `)
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      setLicences(data || []);
    } catch (err: any) {
      console.error("Error fetching licences:", err);
      toast.error(`Failed to load licences: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuards();
    fetchLicences();
  }, [fetchGuards, fetchLicences]);

  const onSubmit = async (values: LicenceFormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    const recordToInsert = {
      ...values,
      issue_date: dayjs(values.issue_date).format('YYYY-MM-DD'),
      expiry_date: dayjs(values.expiry_date).format('YYYY-MM-DD'),
      created_by_user_id: user.id,
    };

    try {
      // TODO: Add Edit logic here if editingLicence is set
      const { error } = await supabase.from('sia_licences').insert(recordToInsert);
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
             toast.error("Failed to add licence: This licence number already exists.");
        } else {
            throw error;
        }
      } else {
        toast.success("SIA Licence added successfully!");
        fetchLicences(); // Refresh list
        setIsModalOpen(false);
        form.reset();
      }
    } catch (err: any) {
      console.error("Error saving licence:", err);
      toast.error(`Failed to save licence: ${err.message}`);
    }
  };

  // Placeholder for Edit/Delete - Not fully implemented in this pass
  // const handleEdit = (licence: SIALicence) => { setEditingLicence(licence); setIsModalOpen(true); form.reset({...licence, issue_date: new Date(licence.issue_date), expiry_date: new Date(licence.expiry_date)})};
  // const handleDelete = async (licenceId: string) => { /* ... */ };


  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" /><span className="sr-only">Back to Home</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Manage SIA Licences</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Add, view, and manage guard SIA licence records.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchLicences} disabled={isLoading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh List
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add New Licence
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{/*editingLicence ? "Edit" :*/ "Add New"} SIA Licence</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                  <FormField
                    control={form.control}
                    name="guard_user_id"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Guard</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select a guard" /></SelectTrigger>
                          <SelectContent>
                            {availableGuards.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.guard_user_id && <p className="text-sm text-red-500">{form.formState.errors.guard_user_id.message}</p>}
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="licence_number" render={({ field }) => (<FormItem><Label>Licence Number</Label><Input {...field} placeholder="Enter licence number" />{form.formState.errors.licence_number && <p className="text-sm text-red-500">{form.formState.errors.licence_number.message}</p>}</FormItem>)} />
                  <FormField
                    control={form.control}
                    name="licence_type"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Licence Type</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select licence type" /></SelectTrigger>
                          <SelectContent>
                            {licenceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.licence_type && <p className="text-sm text-red-500">{form.formState.errors.licence_type.message}</p>}
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="issue_date" render={({ field }) => (<FormItem><Label>Issue Date</Label><Controller control={form.control} name="issue_date" render={({ field: dateField }) => (<DatePicker value={dateField.value} onChange={dateField.onChange} placeholderText="Select issue date" />)} />{form.formState.errors.issue_date && <p className="text-sm text-red-500">{form.formState.errors.issue_date.message}</p>}</FormItem>)} />
                    <FormField control={form.control} name="expiry_date" render={({ field }) => (<FormItem><Label>Expiry Date</Label><Controller control={form.control} name="expiry_date" render={({ field: dateField }) => (<DatePicker value={dateField.value} onChange={dateField.onChange} placeholderText="Select expiry date" />)} />{form.formState.errors.expiry_date && <p className="text-sm text-red-500">{form.formState.errors.expiry_date.message}</p>}</FormItem>)} />
                  </div>
                  {/* Status field can be added here if admin needs to set it manually */}
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Saving..." : "Save Licence"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Existing SIA Licences</CardTitle>
            <CardDescription>{licences.length} licence(s) found.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center text-muted-foreground py-8">Loading licences...</p>}
            {!isLoading && licences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No SIA licences found. Add the first one.</p>
              </div>
            ) : !isLoading && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard Name</TableHead>
                      <TableHead>Licence Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added By</TableHead>
                      {/* <TableHead>Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licences.map((lic) => (
                      <TableRow key={lic.id}>
                        <TableCell>{lic.guard_user?.user_metadata?.full_name || lic.guard_user?.email || lic.guard_user_id}</TableCell>
                        <TableCell className="font-mono">{lic.licence_number}</TableCell>
                        <TableCell>{lic.licence_type}</TableCell>
                        <TableCell>{dayjs(lic.issue_date).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>{dayjs(lic.expiry_date).format('DD/MM/YYYY')}</TableCell>
                        <TableCell><Badge variant={lic.status === 'Active' ? 'default' : 'destructive'} className={lic.status === 'Active' ? 'bg-green-500' : ''}>{lic.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lic.created_by_user?.email || lic.created_by_user_id}</TableCell>
                        {/* <TableCell>
                           <Button variant="ghost" size="icon" onClick={() => handleEdit(lic)}><Edit2 className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(lic.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageLicencesPage;
