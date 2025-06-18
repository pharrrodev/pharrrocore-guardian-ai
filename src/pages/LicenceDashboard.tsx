import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Shield, RefreshCw, CheckCircle, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast as sonnerToast } from 'sonner';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

interface SupabaseLicenceAlert {
  id: string;
  sia_licence_id: string;
  guard_user_id: string;
  licence_number: string;
  expiry_date: string;
  days_until_expiry: number;
  alert_type: string;
  alert_generated_at: string;
  is_acknowledged: boolean;
  acknowledged_by_user_id: string | null;
  acknowledged_at: string | null;
  guard_user: { email?: string; user_metadata?: { full_name?: string } } | null;
  acknowledged_by_user: { email?: string; user_metadata?: { full_name?: string } } | null;
}

const LicenceDashboard = () => {
  const [alerts, setAlerts] = useState<SupabaseLicenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const fetchLicenceAlerts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('licence_alerts')
        .select(`
          *,
          guard_user:guard_user_id ( email, user_metadata ),
          acknowledged_by_user:acknowledged_by_user_id ( email, user_metadata )
        `)
        .eq('is_acknowledged', false)
        .order('days_until_expiry', { ascending: true });

      if (error) {
        console.error('Error fetching licence alerts:', error);
        sonnerToast.error(`Failed to load licence alerts: ${error.message}`);
        setAlerts([]);
      } else {
        setAlerts(data || []);
      }
    } catch (e: any) {
      console.error('Unexpected error fetching alerts:', e);
      sonnerToast.error(`An unexpected error occurred: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const invokeLicenceChecker = async () => {
    setIsChecking(true);
    sonnerToast.info("Requesting licence expiry check...");
    try {
      const { error } = await supabase.functions.invoke('check-licence-expiries');
      if (error) {
        throw error;
      }
      sonnerToast.success("Licence expiry check completed. Refreshing alerts...");
      await fetchLicenceAlerts();
    } catch (error: any) {
      console.error('Error invoking licence checker function:', error);
      sonnerToast.error(`Licence checker invocation failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchLicenceAlerts();

    const licenceAlertsChannel = supabase
      .channel('licence-alerts-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'licence_alerts' },
        (payload) => {
          console.log('Licence alerts change received!', payload);
          sonnerToast.info('Licence alert status has changed. Refreshing list...');
          fetchLicenceAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(licenceAlertsChannel);
    };
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      sonnerToast.error("You must be logged in to acknowledge alerts.");
      return;
    }
    try {
      const { error } = await supabase
        .from('licence_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by_user_id: user.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);
      if (error) throw error;
      sonnerToast.success("Alert acknowledged successfully.");
    } catch (error: any) {
      sonnerToast.error(`Failed to acknowledge alert: ${error.message}`);
    }
  };


  const getSeverityBadge = (daysLeft: number, alertType: string) => {
    if (alertType === 'Expired' || daysLeft < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (alertType === 'Critical' || daysLeft < 30) {
      return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">Critical ({daysLeft}d)</Badge>;
    } else if (alertType === 'Warning' || daysLeft < 60) {
      return <Badge variant="secondary" className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600">Warning ({daysLeft}d)</Badge>;
    } else if (alertType === 'Info') {
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Info ({daysLeft}d)</Badge>;
    }
    return <Badge variant="outline">OK ({daysLeft}d)</Badge>;
  };

  const getRowClassName = (daysLeft: number, alertType: string) => {
    if (alertType === 'Expired' || daysLeft < 0) return "bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500";
    if (alertType === 'Critical' || daysLeft < 30) return "bg-red-50 dark:bg-red-800/30 border-l-4 border-red-400";
    if (alertType === 'Warning' || daysLeft < 60) return "bg-yellow-50 dark:bg-yellow-800/30 border-l-4 border-yellow-400";
    if (alertType === 'Info') return "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400";
    return "border-l-4 border-transparent";
  };

  const criticalAlerts = alerts.filter(alert => alert.alert_type === 'Critical' || alert.alert_type === 'Expired');
  const warningAlerts = alerts.filter(alert => alert.alert_type === 'Warning');
  const totalActiveAlerts = alerts.filter(alert => !alert.is_acknowledged).length;


  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Licence Dashboard</h1>
              <p className="text-muted-foreground">Monitor security guard licence expiry dates</p>
            </div>
          </div>
          <Button onClick={invokeLicenceChecker} disabled={isChecking || isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Run Expiry Check'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActiveAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Unacknowledged licence alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              {/* THIS IS THE FIXED LINE: */}
              <p className="text-xs text-muted-foreground">
                Expired or &lt;30 days remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning Alerts</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                30-60 days remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Licence Expiry Alerts</CardTitle>
            <CardDescription>
              Security guard licences requiring attention (showing unacknowledged alerts).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active licence alerts found.</p>
                <p className="text-sm">All monitored licences are compliant or alerts acknowledged.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard Name</TableHead>
                      <TableHead>Licence Number</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Generated At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        className={cn(getRowClassName(alert.days_until_expiry, alert.alert_type))}
                      >
                        <TableCell className="font-medium flex items-center gap-2">
                          <UserCircle className="w-4 h-4 text-muted-foreground"/>
                          {alert.guard_user?.user_metadata?.full_name || alert.guard_user?.email || alert.guard_user_id}
                        </TableCell>
                        <TableCell className="font-mono">{alert.licence_number}</TableCell>
                        <TableCell>{dayjs(alert.expiry_date).format('DD MMM YYYY')}</TableCell>
                        <TableCell>{getSeverityBadge(alert.days_until_expiry, alert.alert_type)}</TableCell>
                        <TableCell><Badge variant="outline">{alert.alert_type}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dayjs(alert.alert_generated_at).format('DD MMM, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {!alert.is_acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Acknowledge
                            </Button>
                          )}
                        </TableCell>
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

export default LicenceDashboard;
