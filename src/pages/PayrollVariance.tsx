
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, RefreshCw, UserCircle, Edit3, CheckSquare } from 'lucide-react'; // Added icons
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import { toast } from 'sonner'; // Import sonner
import dayjs from 'dayjs'; // For date formatting
import { cn } from '@/lib/utils'; // For conditional class names

// Interface for data fetched from 'payroll_variances' table
interface SupabasePayrollVariance {
  id: string;
  guard_user_id: string;
  shift_id: string | null;
  variance_date: string; // YYYY-MM-DD
  scheduled_hours: number;
  actual_hours_calculated: number;
  paid_hours: number;
  variance_hours: number;
  site_id: string | null;
  notes: string | null;
  report_generated_at: string;
  status: 'Pending' | 'Investigating' | 'Resolved' | 'No Action Required';
  // Joined data
  guard_user: { email?: string; user_metadata?: { full_name?: string } } | null;
}

const PayrollVariance = () => {
  const [variances, setVariances] = useState<SupabasePayrollVariance[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load and manual refresh
  const [isCalculating, setIsCalculating] = useState(false); // For "Run Validator" button
  const [lastUpdated, setLastUpdated] = useState<string>(''); // Keep for display if useful

  const fetchVariances = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_variances')
        .select(`
          *,
          guard_user:guard_user_id ( email, user_metadata )
        `)
        .order('variance_date', { ascending: false })
        .order('report_generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching payroll variances:', error);
        toast.error(`Failed to load variances: ${error.message}`);
        setVariances([]);
      } else {
        setVariances(data || []);
        if (data && data.length > 0) {
          // Set lastUpdated based on the newest report_generated_at from the fetched variances
          setLastUpdated(dayjs(data[0].report_generated_at).toLocaleString());
        } else {
          setLastUpdated('No data');
        }
      }
    } catch (e) {
      console.error('Unexpected error fetching variances:', e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      toast.error(`An unexpected error occurred: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVariances();

    const payrollVariancesChannel = supabase
      .channel('payroll-variances-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payroll_variances' },
        (payload) => {
          console.log('Payroll variances change received!', payload);
          toast.info('Payroll variance data has changed. Refreshing list...');
          fetchVariances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(payrollVariancesChannel);
    };
  }, []);


  const invokeVarianceCalculator = async () => {
    setIsCalculating(true);
    toast.info("Requesting payroll variance calculation...");
    try {
      const { error } = await supabase.functions.invoke('calculate-payroll-variance');
      if (error) throw error;
      toast.success("Payroll variance calculation completed. Refreshing data...");
      // Real-time should pick it up, or call fetchVariances() explicitly if needed after a delay
      // For immediate feedback, we can call it:
      await fetchVariances();
    } catch (error) {
      console.error('Error invoking payroll variance calculator:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Variance calculation failed: ${errorMessage}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const getVarianceBadge = (varianceHours: number) => {
    const absVariance = Math.abs(varianceHours); // Corrected: use varianceHours
    if (absVariance > 1) {
      return <Badge variant="destructive">High Variance</Badge>;
    } else if (absVariance > 0.5) {
      return <Badge variant="secondary">Medium Variance</Badge>;
    } else {
      return <Badge variant="outline">Low Variance</Badge>;
    }
  };

  const getRowClassName = (varianceHours: number) => { // Corrected: parameter name
    const absVariance = Math.abs(varianceHours); // Corrected: use varianceHours
    if (absVariance > 0.25) {
      return "bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payroll Variance Report</h1>
            <p className="text-muted-foreground mt-2">
              Compare actual worked hours vs paid hours to identify discrepancies
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={fetchVariances} // Corrected: use fetchVariances
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={invokeVarianceCalculator} // Corrected: use invokeVarianceCalculator
              disabled={isCalculating || isLoading} // Use isCalculating for this button
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculating...' : 'Run Validator'}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Variances</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{variances.filter(v => Math.abs(v.variance_hours) > 0.25).length}</div>
              <p className="text-xs text-muted-foreground">
                Records with variance {'>'}  0.25h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Variance</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {variances.length > 0 
                  ? (variances.reduce((sum, v) => sum + Math.abs(v.variance_hours), 0) / variances.length).toFixed(2) // Corrected: v.variance_hours
                  : '0.00'
                }h
              </div>
              <p className="text-xs text-muted-foreground">
                Average absolute variance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{lastUpdated || 'Never'}</div>
              <p className="text-xs text-muted-foreground">
                Report generation time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Variance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Variances</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing all records where |variance| {'>'} 0.25 hours
            </p>
          </CardHeader>
          <CardContent>
            {variances.length === 0 && !isLoading ? ( // Added !isLoading condition
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Variances Found</h3>
                <p className="text-muted-foreground mb-4">
                  Either no payroll data is available or all hours match perfectly.
                </p>
                <Button onClick={invokeVarianceCalculator} disabled={isCalculating || isLoading}>
                  <FileText className="h-4 w-4 mr-2" />
                  {isCalculating ? 'Calculating...' : 'Generate Report'}
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading variances...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard Name</TableHead> {/* Changed from Guard ID */}
                      <TableHead>Date</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">Paid Hours</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variances.map((variance) => ( // Removed index as key if variance.id is unique
                      <TableRow 
                        key={variance.id} // Use variance.id if unique
                        className={getRowClassName(variance.variance_hours)} // Corrected
                      >
                        <TableCell className="font-medium">
                          {variance.guard_user?.user_metadata?.full_name || variance.guard_user?.email || variance.guard_user_id}
                        </TableCell>
                        <TableCell>{dayjs(variance.variance_date).format('DD/MM/YYYY')}</TableCell> {/* Corrected */}
                        <TableCell>{variance.site_id || '-'}</TableCell> {/* Corrected */}
                        <TableCell className="text-right">{variance.actual_hours_calculated.toFixed(2)}</TableCell> {/* Corrected */}
                        <TableCell className="text-right">{variance.paid_hours.toFixed(2)}</TableCell> {/* Corrected */}
                        <TableCell className={`text-right font-medium ${
                          variance.variance_hours > 0 ? 'text-green-600' : 'text-red-600' // Corrected
                        }`}>
                          {variance.variance_hours > 0 ? '+' : ''}{variance.variance_hours.toFixed(2)}h {/* Corrected */}
                        </TableCell>
                        <TableCell>{getVarianceBadge(variance.variance_hours)}</TableCell> {/* Corrected */}
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

export default PayrollVariance;
