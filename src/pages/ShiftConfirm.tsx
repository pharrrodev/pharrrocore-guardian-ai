
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';
import { Shift, guards } from '@/data/rota-data';
import { loadRotaData, loadConfirmations, RotaConfirmation } from '@/utils/rotaStore';
import { confirmShift } from '@/api/rota-confirm';
import dayjs from 'dayjs';

const ShiftConfirm = () => {
  const [selectedGuardId, setSelectedGuardId] = useState<string>('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [confirmations, setConfirmations] = useState<RotaConfirmation[]>([]);

  useEffect(() => {
    // Load rota data and confirmations
    const rotaData = loadRotaData();
    const confirmData = loadConfirmations();
    setShifts(rotaData);
    setConfirmations(confirmData);
  }, []);

  const getGuardShifts = (guardId: string): Shift[] => {
    return shifts.filter(shift => shift.guardId === guardId);
  };

  const getShiftConfirmation = (shiftId: string): RotaConfirmation | undefined => {
    return confirmations.find(c => c.shiftId === shiftId);
  };

  const handleConfirmShift = async (shift: Shift, confirmed: boolean) => {
    const guard = guards.find(g => g.id === shift.guardId);
    if (!guard) return;

    try {
      const response = await confirmShift({
        guardId: shift.guardId,
        guardName: guard.name,
        date: shift.date,
        shiftId: shift.id,
        confirmed
      });

      if (response.status === 'ok') {
        // Update local confirmations
        const updatedConfirmations = loadConfirmations();
        setConfirmations(updatedConfirmations);
        
        toast.success(
          confirmed 
            ? 'Shift confirmed successfully' 
            : 'Shift declined successfully'
        );
      } else {
        toast.error(response.message || 'Failed to update shift status');
      }
    } catch (error) {
      toast.error('Error updating shift status');
      console.error('Confirmation error:', error);
    }
  };

  const getShiftStatus = (shift: Shift) => {
    const confirmation = getShiftConfirmation(shift.id);
    if (!confirmation) return 'pending';
    return confirmation.confirmed ? 'confirmed' : 'declined';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'declined': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="w-4 h-4" />;
      case 'declined': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const guardShifts = selectedGuardId ? getGuardShifts(selectedGuardId) : [];
  const selectedGuard = guards.find(g => g.id === selectedGuardId);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Shift Confirmation</h1>
        </div>

        {/* Guard Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Your Profile</CardTitle>
            <CardDescription>Choose your name to view and confirm your shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedGuardId} onValueChange={setSelectedGuardId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent>
                {guards.map(guard => (
                  <SelectItem key={guard.id} value={guard.id}>
                    {guard.name} - {guard.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Shifts List */}
        {selectedGuardId && (
          <Card>
            <CardHeader>
              <CardTitle>Your Scheduled Shifts</CardTitle>
              <CardDescription>
                {selectedGuard?.name} - {guardShifts.length} shifts assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {guardShifts.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No Shifts Assigned</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any shifts assigned yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {guardShifts
                    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
                    .map(shift => {
                      const status = getShiftStatus(shift);
                      const confirmation = getShiftConfirmation(shift.id);
                      const isPastDate = dayjs(shift.date).isBefore(dayjs(), 'day');
                      
                      return (
                        <div key={shift.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium">
                                  {dayjs(shift.date).format('dddd, MMMM D, YYYY')}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
                                  {getStatusIcon(status)}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </div>
                              
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>
                                  <strong>Time:</strong> {shift.startTime} - {shift.endTime} ({shift.shiftType})
                                </div>
                                <div>
                                  <strong>Position:</strong> {shift.position}
                                </div>
                                {confirmation && (
                                  <div>
                                    <strong>Confirmed:</strong> {dayjs(confirmation.timestamp).format('MMM D, YYYY h:mm A')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {!isPastDate && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={status === 'confirmed' ? 'default' : 'outline'}
                                  onClick={() => handleConfirmShift(shift, true)}
                                  disabled={status === 'confirmed'}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant={status === 'declined' ? 'destructive' : 'outline'}
                                  onClick={() => handleConfirmShift(shift, false)}
                                  disabled={status === 'declined'}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            )}

                            {isPastDate && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                Past Date
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShiftConfirm;
