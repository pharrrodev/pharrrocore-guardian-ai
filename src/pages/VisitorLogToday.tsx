
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, Users, Clock, Building, UserCheck, LogOut } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getTodaysVisitorLogs, VisitorLogEntry } from "@/utils/csvHelpers";
import { submitVisitorLog } from "@/api/visitor-log";

const VisitorLogToday = () => {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLogEntry[]>([]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const loadLogs = () => {
    const logs = getTodaysVisitorLogs();
    setVisitorLogs(logs);
  };

  useEffect(() => {
    loadLogs();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadLogs, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCheckOut = async (visitor: VisitorLogEntry) => {
    setCheckingOut(visitor.id);
    try {
      const response = await submitVisitorLog({
        visitorName: visitor.visitorName,
        company: visitor.company,
        escort: visitor.escort,
        mode: 'out',
      });

      if (response.status === 'ok') {
        toast.success(response.message);
        loadLogs(); // Refresh the logs
      } else {
        toast.error(response.message || 'Failed to check out visitor');
      }
    } catch (error) {
      toast.error('An error occurred while checking out the visitor');
      console.error('Check-out error:', error);
    } finally {
      setCheckingOut(null);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    return dayjs(timeString).format("HH:mm");
  };

  const formatDuration = (arrivalTime: string, departureTime?: string) => {
    if (!departureTime) return "-";
    const arrival = dayjs(arrivalTime);
    const departure = dayjs(departureTime);
    const duration = departure.diff(arrival, 'minutes');
    
    if (duration < 60) {
      return `${duration}m`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const activeVisitors = visitorLogs.filter(log => !log.departureTime).length;
  const totalVisitors = visitorLogs.length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Today's Visitor Log</h1>
              <p className="text-muted-foreground">
                {dayjs().format("dddd, MMMM D, YYYY")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/visitor-form">
                <UserCheck className="w-4 h-4 mr-2" />
                New Check-In
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Visitors</p>
                  <p className="text-2xl font-bold">{totalVisitors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Currently On-Site</p>
                  <p className="text-2xl font-bold">{activeVisitors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Checked Out</p>
                  <p className="text-2xl font-bold">{totalVisitors - activeVisitors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Visitor Entries</CardTitle>
            <CardDescription>
              Complete log of all visitor activity for today. Click "Check Out" for active visitors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visitorLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No visitors logged for today.</p>
                <Button asChild className="mt-4">
                  <Link to="/visitor-form">Add First Entry</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Visitor Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Escort</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorLogs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className={!log.departureTime ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                      >
                        <TableCell>
                          <Badge 
                            variant={log.departureTime ? "outline" : "default"}
                            className={log.departureTime ? "" : "bg-green-500 hover:bg-green-600"}
                          >
                            {log.departureTime ? "Checked Out" : "On-Site"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.visitorName}</TableCell>
                        <TableCell>{log.company}</TableCell>
                        <TableCell>{log.escort}</TableCell>
                        <TableCell>{formatTime(log.arrivalTime)}</TableCell>
                        <TableCell>{formatTime(log.departureTime)}</TableCell>
                        <TableCell>{formatDuration(log.arrivalTime, log.departureTime)}</TableCell>
                        <TableCell>
                          {!log.departureTime ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(log)}
                              disabled={checkingOut === log.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {checkingOut === log.id ? (
                                "Checking Out..."
                              ) : (
                                <>
                                  <LogOut className="w-4 h-4 mr-1" />
                                  Check Out
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">Completed</span>
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

export default VisitorLogToday;
