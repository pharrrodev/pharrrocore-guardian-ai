
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home, Users, Clock, Building, UserCheck, LogOut, CameraOff, Image as ImageIcon, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // For photo modal


// Define the structure of a visitor log entry from Supabase
interface VisitorLogSupabaseEntry {
  id: string;
  visitor_name: string;
  company: string | null;
  visit_purpose: string | null;
  person_to_visit: string | null;
  arrival_time: string;
  departure_time: string | null;
  photo_url: string | null;
  vehicle_registration: string | null;
  user_id_check_in: string | null;
  user_id_check_out: string | null;
  created_at: string;
  updated_at: string;
  check_in_user: { email: string } | null; // For joined user email
  check_out_user: { email: string } | null; // For joined user email
}

const VisitorLogToday = () => {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLogSupabaseEntry[]>([]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    const todayStart = dayjs().startOf('day').toISOString();
    const todayEnd = dayjs().endOf('day').toISOString();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to view visitor logs.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('visitor_logs')
        .select(`
          *,
          check_in_user:user_id_check_in ( email ),
          check_out_user:user_id_check_out ( email )
        `)
        .gte('arrival_time', todayStart)
        .lte('arrival_time', todayEnd)
        .order('arrival_time', { ascending: false });

      if (error) {
        console.error("Error fetching visitor logs:", error);
        toast.error(`Failed to fetch logs: ${error.message}`);
        setVisitorLogs([]); // Clear logs on error
      } else {
        setVisitorLogs(data || []);
      }
    } catch (e) {
      console.error("Unexpected error fetching logs:", e);
      toast.error("An unexpected error occurred while fetching logs.");
      setVisitorLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    // Optional: Set up real-time subscription or polling if needed
    // const subscription = supabase.channel('visitor_logs_channel')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_logs' }, fetchLogs)
    //   .subscribe();
    // return () => { supabase.removeChannel(subscription); };
  }, [fetchLogs]);

  const handleCheckOut = async (logId: string) => {
    setCheckingOut(logId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to check out a visitor.");
        setCheckingOut(null);
        return;
      }

      const { error } = await supabase
        .from('visitor_logs')
        .update({
          departure_time: new Date().toISOString(),
          user_id_check_out: user.id,
        })
        .eq('id', logId);

      if (error) {
        console.error("Error checking out visitor:", error);
        toast.error(`Failed to check out visitor: ${error.message}`);
      } else {
        toast.success("Visitor checked out successfully.");
        fetchLogs(); // Refresh the logs
      }
    } catch (e) {
      console.error("Unexpected error during check-out:", e);
      toast.error("An unexpected error occurred during check-out.");
    } finally {
      setCheckingOut(null);
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return dayjs(timeString).format("HH:mm");
  };

  const formatDateTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return dayjs(timeString).format("DD/MM HH:mm");
  }

  const formatDuration = (arrivalTime: string, departureTime?: string | null) => {
    if (!departureTime) return "-";
    const arrival = dayjs(arrivalTime);
    const departure = dayjs(departureTime);
    const duration = departure.diff(arrival, 'minutes');
    
    if (duration < 0) return "Invalid"; // Should not happen
    if (duration < 60) return `${duration}m`;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const activeVisitors = visitorLogs.filter(log => !log.departure_time).length;
  const totalVisitors = visitorLogs.length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto"> {/* Increased max-width for more columns */}
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
             <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                  <p className="text-sm text-muted-foreground">Total Visitors Today</p>
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
                  <p className="text-sm text-muted-foreground">Checked Out Today</p>
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
              Log of all visitor activity for today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center text-muted-foreground">Loading logs...</p>}
            {!isLoading && visitorLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No visitors logged for today.</p>
              </div>
            ) : !isLoading && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Visitor Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Vehicle Reg.</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Checked In By</TableHead>
                      <TableHead>Checked Out By</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorLogs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className={!log.departure_time ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                      >
                        <TableCell>
                          <Badge 
                            variant={log.departure_time ? "outline" : "default"}
                            className={log.departure_time ? "" : "bg-green-500 hover:bg-green-600"}
                          >
                            {log.departure_time ? "Checked Out" : "On-Site"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.photo_url ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                                  <img src={log.photo_url} alt={log.visitor_name} className="w-8 h-8 rounded-full object-cover" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>{log.visitor_name}'s Photo</DialogTitle></DialogHeader>
                                <img src={log.photo_url} alt={log.visitor_name} className="w-full h-auto rounded-md" />
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <CameraOff className="w-5 h-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{log.visitor_name}</TableCell>
                        <TableCell>{log.company || "-"}</TableCell>
                        <TableCell>{log.visit_purpose || "-"}</TableCell>
                        <TableCell>{log.person_to_visit || "-"}</TableCell>
                        <TableCell>{log.vehicle_registration || "-"}</TableCell>
                        <TableCell title={log.arrival_time}>{formatTime(log.arrival_time)}</TableCell>
                        <TableCell title={log.departure_time || undefined}>{formatTime(log.departure_time)}</TableCell>
                        <TableCell>{formatDuration(log.arrival_time, log.departure_time)}</TableCell>
                        <TableCell>{log.check_in_user?.email || "N/A"}</TableCell>
                        <TableCell>{log.check_out_user?.email || "-"}</TableCell>
                        <TableCell>
                          {!log.departure_time ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(log.id)}
                              disabled={checkingOut === log.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-500 dark:hover:bg-red-950/30"
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
