
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Shield, RefreshCw } from 'lucide-react';
import { getLicenceAlerts, runLicenceChecker } from '../scripts/licenceChecker';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';

interface LicenceAlert {
  id: string;
  guardId: string;
  guardName: string;
  licenceNumber: string;
  expiresDate: string;
  daysLeft: number;
  timestamp: string;
}

const LicenceDashboard = () => {
  const [alerts, setAlerts] = useState<LicenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAlerts = () => {
    setLoading(true);
    try {
      const licenceAlerts = getLicenceAlerts();
      setAlerts(licenceAlerts);
    } catch (error) {
      console.error('Error loading licence alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load licence alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runChecker = () => {
    setLoading(true);
    try {
      runLicenceChecker();
      toast({
        title: "Success",
        description: "Licence checker completed successfully"
      });
      // Reload alerts after running checker
      setTimeout(loadAlerts, 1000);
    } catch (error) {
      console.error('Error running licence checker:', error);
      toast({
        title: "Error",
        description: "Failed to run licence checker",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const getSeverityBadge = (daysLeft: number) => {
    if (daysLeft < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysLeft < 30) {
      return <Badge variant="destructive">Critical ({daysLeft}d)</Badge>;
    } else if (daysLeft < 60) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning ({daysLeft}d)</Badge>;
    }
    return <Badge variant="outline">({daysLeft}d)</Badge>;
  };

  const getRowClassName = (daysLeft: number) => {
    if (daysLeft < 0) {
      return "bg-red-50 hover:bg-red-100";
    } else if (daysLeft < 30) {
      return "bg-red-50 hover:bg-red-100";
    } else if (daysLeft < 60) {
      return "bg-yellow-50 hover:bg-yellow-100";
    }
    return "";
  };

  const criticalAlerts = alerts.filter(alert => alert.daysLeft < 30);
  const warningAlerts = alerts.filter(alert => alert.daysLeft >= 30 && alert.daysLeft < 60);

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
          <Button onClick={runChecker} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Run Checker
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">
                Licences expiring within 60 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                Less than 30 days remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning</CardTitle>
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
              Security guard licences requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No licence alerts found</p>
                <p className="text-sm">All licences are valid for the next 60 days</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guard Name</TableHead>
                    <TableHead>Guard ID</TableHead>
                    <TableHead>Licence Number</TableHead>
                    <TableHead>Expires Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Checked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow 
                      key={`${alert.guardId}-${alert.licenceNumber}`}
                      className={getRowClassName(alert.daysLeft)}
                    >
                      <TableCell className="font-medium">{alert.guardName}</TableCell>
                      <TableCell>{alert.guardId}</TableCell>
                      <TableCell>{alert.licenceNumber}</TableCell>
                      <TableCell>{dayjs(alert.expiresDate).format('MMM DD, YYYY')}</TableCell>
                      <TableCell>{getSeverityBadge(alert.daysLeft)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dayjs(alert.timestamp).format('MMM DD, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LicenceDashboard;
