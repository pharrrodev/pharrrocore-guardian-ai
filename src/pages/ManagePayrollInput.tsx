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
import { PlusCircle, ArrowLeft, Users, RefreshCw } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { toast } from 'sonner';

// Types
interface GuardUser { // Represents the structure used in availableGuards state
  id: string;
  name: string;
}

// Type for the data items returned by the 'get-guard-list' Supabase function
interface GuardListDataItem {
  id: string;
  name?: string;
  email?: string;
}

interface PayrollInput {
  id: string;
  guard_user_id: string;
  pay_period_start_date: string; // YYYY-MM-DD
  pay_period_end_date: string; // YYYY-MM-DD
  hours_paid: number;
  source_reference?: string | null;
  input_by_user_id: string;
  created_at: string;
  // Joined data
  guard_user?: { email?: string; user_metadata?: { full_name?: string } };
  input_by_user?: { email?: string; user_metadata?: { full_name?: string } };
}

const payrollInputFormSchema = z.object({
  guard_user_id: z.string().uuid({ message: "Please select a guard." }),
  pay_period_start_date: z.date({ required_error: "Pay period start date is required." }),
  pay_period_end_date: z.date({ required_error: "Pay period end date is required." }),
  hours_paid: z.number().positive({ message: "Hours paid must be a positive number." }),
  source_reference: z.string().optional(),
}).refine(data => dayjs(data.pay_period_end_date).isAfter(dayjs(data.pay_period_start_date)), {
  message: "Pay period end date must be after start date.",
  path: ["pay_period_end_date"],
});

type PayrollInputFormValues = z.infer<typeof payrollInputFormSchema>;

const ManagePayrollInputPage = () => {
  const [payrollInputs, setPayrollInputs] = useState<PayrollInput[]>([]);
  const [availableGuards, setAvailableGuards] = useState<GuardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<PayrollInputFormValues>({
    resolver: zodResolver(payrollInputFormSchema),
    defaultValues: {
      guard_user_id: '',
      pay_period_start_date: undefined,
      pay_period_end_date: undefined,
      hours_paid: 0,
      source_reference: '',
    },
  });

  const fetchGuards = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-guard-list');
      if (error) throw error;
      if (data && Array.isArray(data)) {
        setAvailableGuards(data.map((g: GuardListDataItem) => ({
          id: g.id,
          name: g.name || g.email || `User ${g.id.substring(0,6)}`
        })));
      } else {
        setAvailableGuards([]);
      }
    } catch (err) {
      console.error("Error fetching guards:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(`Failed to load guard list: ${errorMessage}`);
    }
  }, []);

  const fetchPayrollInputs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_input_data')
        .select(`
          *,
          guard_user:guard_user_id ( email, user_metadata ),
          input_by_user:input_by_user_id ( email, user_metadata )
        `)
        .order('pay_period_start_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayrollInputs(data || []);
    } catch (err) {
      console.error("Error fetching payroll inputs:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(`Failed to load payroll input data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuards();
    fetchPayrollInputs();
  }, [fetchGuards, fetchPayrollInputs]);

  const onSubmit = async (values: PayrollInputFormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    const recordToInsert = {
      ...values,
      pay_period_start_date: dayjs(values.pay_period_start_date).format('YYYY-MM-DD'),
      pay_period_end_date: dayjs(values.pay_period_end_date).format('YYYY-MM-DD'),
      hours_paid: Number(values.hours_paid), // Ensure it's a number
      input_by_user_id: user.id,
      source_reference: values.source_reference || null,
    };

    try {
      const { error } = await supabase.from('payroll_input_data').insert(recordToInsert);
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
             toast.error("Failed to add: Payroll data for this guard and pay period already exists.");
        } else {
            throw error;
        }
      } else {
        toast.success("Payroll input data added successfully!");
        fetchPayrollInputs(); // Refresh list
        setIsModalOpen(false);
        form.reset();
      }
    } catch (err) {
      console.error("Error saving payroll input:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(`Failed to save payroll input: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/"> {/* Adjust link as needed, e.g., to an admin dashboard */}
                <ArrowLeft className="h-5 w-5" /><span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Manage Payroll Input</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Add and view manually inputted payroll data.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchPayrollInputs} disabled={isLoading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh List
            </Button>
            <Dialog open={isModalOpen} onOpenChange={ (open) => { if (!open) form.reset(); setIsModalOpen(open); }}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { form.reset(); setIsModalOpen(true); } }>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Payroll Data
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Add New Payroll Input</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                  <FormField control={form.control} name="guard_user_id" render={({ field }) => (
                    <FormItem><Label>Guard</Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select a guard" /></SelectTrigger>
                        <SelectContent>
                          {availableGuards.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.guard_user_id && <p className="text-sm text-red-500">{form.formState.errors.guard_user_id.message}</p>}
                    </FormItem>)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="pay_period_start_date" render={({ field }) => (<FormItem><Label>Pay Period Start</Label><Controller control={form.control} name="pay_period_start_date" render={({ field: dateField }) => (<DatePicker value={dateField.value} onChange={dateField.onChange} placeholderText="Start date" />)} />{form.formState.errors.pay_period_start_date && <p className="text-sm text-red-500">{form.formState.errors.pay_period_start_date.message}</p>}</FormItem>)} />
                    <FormField control={form.control} name="pay_period_end_date" render={({ field }) => (<FormItem><Label>Pay Period End</Label><Controller control={form.control} name="pay_period_end_date" render={({ field: dateField }) => (<DatePicker value={dateField.value} onChange={dateField.onChange} placeholderText="End date" />)} />{form.formState.errors.pay_period_end_date && <p className="text-sm text-red-500">{form.formState.errors.pay_period_end_date.message}</p>}</FormItem>)} />
                  </div>
                  <FormField control={form.control} name="hours_paid" render={({ field }) => (<FormItem><Label>Hours Paid</Label><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} placeholder="e.g., 80.5" />{form.formState.errors.hours_paid && <p className="text-sm text-red-500">{form.formState.errors.hours_paid.message}</p>}</FormItem>)} />
                  <FormField control={form.control} name="source_reference" render={({ field }) => (<FormItem><Label>Source Reference (Optional)</Label><Input {...field} placeholder="e.g., Batch ID, System Name" />{form.formState.errors.source_reference && <p className="text-sm text-red-500">{form.formState.errors.source_reference.message}</p>}</FormItem>)} />
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" onClick={() => {form.reset(); setIsModalOpen(false);}}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Saving..." : "Save Payroll Input"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Input Records</CardTitle>
            <CardDescription>{payrollInputs.length} record(s) found.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center text-muted-foreground py-8">Loading records...</p>}
            {!isLoading && payrollInputs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No payroll input data found.</p>
              </div>
            ) : !isLoading && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard Name</TableHead>
                      <TableHead>Pay Period Start</TableHead>
                      <TableHead>Pay Period End</TableHead>
                      <TableHead>Hours Paid</TableHead>
                      <TableHead>Source Ref.</TableHead>
                      <TableHead>Input By</TableHead>
                      <TableHead>Input Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollInputs.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.guard_user?.user_metadata?.full_name || item.guard_user?.email || item.guard_user_id}</TableCell>
                        <TableCell>{dayjs(item.pay_period_start_date).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>{dayjs(item.pay_period_end_date).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>{item.hours_paid.toFixed(2)}</TableCell>
                        <TableCell>{item.source_reference || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.input_by_user?.email || item.input_by_user_id}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}</TableCell>
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

export default ManagePayrollInputPage;
