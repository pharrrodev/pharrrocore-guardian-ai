
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, Users, Calendar, AlertTriangle, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import { toast } from 'sonner'; // Import toast for error notifications
import dayjs from 'dayjs';

// Interface for shifts fetched from Supabase (matches 'shifts' table structure)
// This should be the same as defined in RotaBuilder.tsx after its refactor
export interface SupabaseShift {
  id: string;
  guard_id: string;
  guard_name: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  position: string;
  shift_type: 'Day' | 'Night' | 'Evening';
  break_times?: Array<{ breakStart: string; breakEnd: string; breakType: string }>;
  site_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Interface for shift activities (confirmations)
export interface ShiftActivity {
  id: string;
  shift_id: string;
  activity_type: 'Shift Confirmed' | 'Shift Declined'; // Focus on these two for status
  "timestamp": string; // ISO string
  notes?: string | null;
  guard_id: string; // User who confirmed/declined (can be different from shift.guard_id)
}

const RotaDashboard = () => {
  const [shifts, setShifts] = useState<SupabaseShift[]>([]);
  const [activities, setActivities] = useState<ShiftActivity[]>([]); // Renamed from confirmations
  const [isLoading, setIsLoading] = useState(true);

  const fetchRotaData = async () => {
    setIsLoading(true);
    try {
      const today = dayjs();
      const twoWeeksFromNow = today.add(14, 'day');

      // Fetch shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .gte('shift_date', today.format('YYYY-MM-DD')) // From today
        .lte('shift_date', twoWeeksFromNow.format('YYYY-MM-DD')) // For next 14 days
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (shiftsError) throw shiftsError;
      setShifts(shiftsData || []);

      // Fetch confirmations for the fetched shifts
      if (shiftsData && shiftsData.length > 0) {
        const shiftIds = shiftsData.map(s => s.id);
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('shift_activities')
          .select('*')
          .in('shift_id', shiftIds)
          .in('activity_type', ['Shift Confirmed', 'Shift Declined'])
          .order('timestamp', { ascending: false }); // Get latest activity first for each shift

        if (activitiesError) throw activitiesError;
        setActivities(activitiesData || []);
      } else {
        setActivities([]); // No shifts, so no activities to fetch
      }

    } catch (error: any) {
      console.error('Error fetching rota data:', error);
      toast.error(`Failed to load rota: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRotaData(); // Initial fetch

    // Set up real-time subscriptions
    const shiftsChannel = supabase
      .channel('rota-dashboard-shifts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        (payload) => {
          console.log('Shifts change received!', payload);
          toast.info('Rota has been updated. Refreshing...');
          fetchRotaData(); // Re-fetch all data on any change for simplicity
        }
      )
      .subscribe();

    const activitiesChannel = supabase
      .channel('rota-dashboard-activities-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shift_activities' },
        (payload) => {
          console.log('Shift activities change received!', payload);
          // Check if the change is relevant to current view (e.g. a confirmation)
          if (payload.new && ['Shift Confirmed', 'Shift Declined'].includes((payload.new as ShiftActivity).activity_type) ) {
            toast.info('Shift confirmation status updated. Refreshing...');
            fetchRotaData(); // Re-fetch all data
          } else if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
            // Handle potential updates or deletes if they affect status
            fetchRotaData();
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on component unmount
    return () => {
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, []); // Run once on mount

  const getShiftConfirmationActivity = (shiftId: string): ShiftActivity | undefined => {
    // Find the most recent 'Shift Confirmed' or 'Shift Declined' activity for this shift
    return activities
      .filter(act => act.shift_id === shiftId && (act.activity_type === 'Shift Confirmed' || act.activity_type === 'Shift Declined'))
      .sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp))) // Sort descending by time
      [0]; // Get the latest one
  };

  const getShiftStatus = (shift: SupabaseShift): 'confirmed' | 'declined' | 'pending' => {
    const activity = getShiftConfirmationActivity(shift.id);
    if (!activity) return 'pending';
    return activity.activity_type === 'Shift Confirmed' ? 'confirmed' : 'declined';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'declined': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="w-4 h-4" />;
      case 'declined': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Filter shifts for next 14 days
  const upcomingShifts = shifts.filter(shift => {
    const shiftDate = dayjs(shift.date);
    const today = dayjs();
    const twoWeeksFromNow = today.add(14, 'day');
    return shiftDate.isAfter(today.subtract(1, 'day')) && shiftDate.isBefore(twoWeeksFromNow);
  }).sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

  // Calculate statistics
  const totalShifts = upcomingShifts.length;
  const confirmedShifts = upcomingShifts.filter(shift => getShiftStatus(shift) === 'confirmed').length;
  const declinedShifts = upcomingShifts.filter(shift => getShiftStatus(shift) === 'declined').length;
  const pendingShifts = totalShifts - confirmedShifts - declinedShifts;

  // Group shifts by date for better visualization
  const shiftsByDate = upcomingShifts.reduce((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Rota Dashboard</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShifts}</div>
              <p className="text-xs text-muted-foreground">Next 14 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{confirmedShifts}</div>
              <p className="text-xs text-muted-foreground">
                {totalShifts > 0 ? Math.round((confirmedShifts / totalShifts) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingShifts}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{declinedShifts}</div>
              <p className="text-xs text-muted-foreground">Need replacement</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-6">
          <Button asChild>
            <Link to="/rota-builder">Manage Rota</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/shift-confirm">Confirm Shifts</Link>
          </Button>
        </div>

        {/* Shifts by Date */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shifts</CardTitle>
            <CardDescription>Shift confirmations for the next 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(shiftsByDate).length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No Upcoming Shifts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No shifts scheduled for the next 14 days.
                </p>
                <Button asChild>
                  <Link to="/rota-builder">Create Shifts</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(shiftsByDate).map(([date, dayShifts]) => (
                  <div key={date}>
                    <h3 className="font-medium text-lg mb-3">
                      {dayjs(date).format('dddd, MMMM D, YYYY')}
                    </h3>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guard</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Confirmed At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayShifts.map(shift => {
                          const status = getShiftStatus(shift);
                          const confirmation = getShiftConfirmation(shift.id);
                          
                          return (
                            <TableRow key={shift.id}>
                              <TableCell className="font-medium">{shift.guardName}</TableCell>
                              <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                              <TableCell>{shift.position}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  shift.shiftType === 'Day' ? 'bg-yellow-100 text-yellow-800' :
                                  shift.shiftType === 'Evening' ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {shift.shiftType}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`flex items-center gap-1 font-medium ${getStatusColor(status)}`}>
                                  {getStatusIcon(status)}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {confirmation ? 
                                  dayjs(confirmation.timestamp).format('MMM D, h:mm A') : 
                                  '-'
                                }
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RotaDashboard;
