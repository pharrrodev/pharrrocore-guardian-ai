
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, Users, Calendar, AlertTriangle } from 'lucide-react';
import { Shift } from '@/data/rota-data';
import { loadRotaData, loadConfirmations, RotaConfirmation } from '@/utils/rotaStore';
import dayjs from 'dayjs';

const RotaDashboard = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [confirmations, setConfirmations] = useState<RotaConfirmation[]>([]);

  useEffect(() => {
    const rotaData = loadRotaData();
    const confirmData = loadConfirmations();
    setShifts(rotaData);
    setConfirmations(confirmData);
  }, []);

  const getShiftConfirmation = (shiftId: string): RotaConfirmation | undefined => {
    return confirmations.find(c => c.shiftId === shiftId);
  };

  const getShiftStatus = (shift: Shift) => {
    const confirmation = getShiftConfirmation(shift.id);
    if (!confirmation) return 'pending';
    return confirmation.confirmed ? 'confirmed' : 'declined';
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
