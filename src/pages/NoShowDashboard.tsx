
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, RefreshCw, Clock, Filter, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import { toast } from 'sonner'; // For notifications

// Define the structure for NoShowAlerts from Supabase
interface SupabaseNoShowAlert {
  id: string;
  guard_id: string;
  expected_shift_start_time: string;
  alert_time: string;
  shift_id: string | null;
  site_id: string | null;
  status: string; // 'Pending', 'Acknowledged', 'Resolved'
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  guard: { email: string } | null; // Joined data from auth.users for guard_id
  acknowledger: { email: string } | null; // Joined data for acknowledged_by
}

const NoShowDashboard = () => {
  const [alerts, setAlerts] = useState<SupabaseNoShowAlert[]>([]);
  const [showLast24Hours, setShowLast24Hours] = useState(true); // Default to last 24h
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState<string | null>(null); // For button loading state

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('no_show_alerts')
        .select(`
          *,
          guard:guard_id ( email ),
          acknowledger:acknowledged_by ( email )
        `)
        .order('alert_time', { ascending: false });

      if (showLast24Hours) {
        query = query.gte('alert_time', dayjs().subtract(24, 'hours').toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching no-show alerts:', error);
        toast.error(`Failed to fetch alerts: ${error.message}`);
        setAlerts([]);
      } else {
        setAlerts(data || []);
      }
    } catch (e) {
      console.error('Unexpected error fetching alerts:', e);
      toast.error('An unexpected error occurred while fetching alerts.');
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [showLast24Hours]);

  // "Check Now" button will just refresh data from DB.
  // The actual noShowCheck.ts script is assumed to run periodically in the backend.
  const handleManualCheck = () => {
    fetchAlerts();
  };

  const handleAcknowledge = async (alertId: string) => {
    setIsAcknowledging(alertId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to acknowledge alerts.");
      setIsAcknowledging(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('no_show_alerts')
        .update({
          status: 'Acknowledged',
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('status', 'Pending'); // Only acknowledge if pending

      if (error) {
        console.error('Error acknowledging alert:', error);
        toast.error(`Failed to acknowledge alert: ${error.message}`);
      } else {
        toast.success('Alert acknowledged.');
        fetchAlerts(); // Refresh data
      }
    } catch (e) {
      console.error('Unexpected error acknowledging alert:', e);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsAcknowledging(null);
    }
  };


  const getTimeSinceAlert = (alertTime: string) => {
    const now = dayjs();
    const alertTimeDate = dayjs(alertTime);
    const minutesAgo = now.diff(alertTimeDate, 'minute');
    
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${minutesAgo}m ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h ago`;

    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo}d ago`;
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'Pending':
        return 'destructive';
      case 'Acknowledged':
        return 'secondary'; // Or a yellow/orange color
      case 'Resolved':
        return 'default'; // Green
      default:
        return 'outline';
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground py-10">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4" />
          Loading no-show alerts...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">No-Show Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor guards who failed to check in for their shifts
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showLast24Hours ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowLast24Hours(prev => !prev);
              // fetchAlerts will be called by useEffect due to showLast24Hours change
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showLast24Hours ? 'Showing Last 24h' : 'Showing All Time'}
          </Button>
          <Button onClick={handleManualCheck} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Alerts'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (Last 30 min)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(alert => dayjs().diff(dayjs(alert.alertTime), 'minute') < 30).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(alert => dayjs(alert.alertTime).isSame(dayjs(), 'day')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No-Show Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showLast24Hours 
                ? "No no-show alerts in the last 24 hours." 
                : "No no-show alerts found. All guards are checking in on time!"
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guard Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift Start Time</TableHead>
                  <TableHead>Alert Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts
                  .sort((a, b) => dayjs(b.alertTime).diff(dayjs(a.alertTime)))
                  .map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.guardName}</TableCell>
                    <TableCell>{dayjs(alert.date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{alert.shiftStartTime}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{dayjs(alert.alertTime).format('DD/MM/YYYY HH:mm')}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeSinceAlert(alert.alertTime)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAlertSeverity(alert.alertTime)}>
                        No Show
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NoShowDashboard;
