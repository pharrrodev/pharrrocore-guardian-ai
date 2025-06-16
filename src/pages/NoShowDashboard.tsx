
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, RefreshCw, Clock, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { NoShowAlert, getNoShowAlerts, getAlertsLast24Hours, checkNoShows } from '@/scripts/noShowCheck';

const NoShowDashboard = () => {
  const [alerts, setAlerts] = useState<NoShowAlert[]>([]);
  const [showLast24Hours, setShowLast24Hours] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    if (showLast24Hours) {
      setAlerts(getAlertsLast24Hours());
    } else {
      setAlerts(getNoShowAlerts());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, [showLast24Hours]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const newAlerts = checkNoShows();
      if (newAlerts.length > 0) {
        loadAlerts(); // Refresh the display
      }
    } catch (error) {
      console.error('Error running no-show check:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getTimeSinceAlert = (alertTime: string) => {
    const now = dayjs();
    const alert = dayjs(alertTime);
    const minutesAgo = now.diff(alert, 'minute');
    
    if (minutesAgo < 60) {
      return `${minutesAgo}m ago`;
    } else if (minutesAgo < 1440) {
      return `${Math.floor(minutesAgo / 60)}h ago`;
    } else {
      return `${Math.floor(minutesAgo / 1440)}d ago`;
    }
  };

  const getAlertSeverity = (alertTime: string) => {
    const minutesAgo = dayjs().diff(dayjs(alertTime), 'minute');
    
    if (minutesAgo < 30) {
      return 'destructive'; // Red for recent alerts
    } else if (minutesAgo < 120) {
      return 'secondary'; // Yellow for older alerts
    } else {
      return 'outline'; // Gray for old alerts
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading no-show alerts...</div>
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
            onClick={() => setShowLast24Hours(!showLast24Hours)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showLast24Hours ? 'Show All' : 'Last 24h'}
          </Button>
          <Button onClick={handleManualCheck} disabled={isChecking} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Now'}
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
