
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Home, User } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shift, guards } from '@/data/rota-data';
import { loadRotaData, loadConfirmations } from '@/utils/rotaStore';
import { confirmShift } from '@/api/rota-confirm';

interface Confirmation {
  guardId: string;
  date: string; // YYYY-MM-DD
  shiftId: string;
  confirmed: boolean;
  // Potentially other fields if present in localStorage
}

const ShiftConfirm = () => {
  const [guardId, setGuardId] = useState('');
  const [guardName, setGuardName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]); // Use Confirmation interface
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);

  useEffect(() => {
    // Load rota data and confirmations
    const rotaData = loadRotaData();
    const existingConfirmations = loadConfirmations();
    setShifts(rotaData);
    setConfirmations(existingConfirmations);
  }, []);

  useEffect(() => {
    // Filter shifts based on guard and date
    if (guardName && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const relevant = shifts.filter(shift => 
        shift.guardName.toLowerCase().includes(guardName.toLowerCase()) && 
        shift.date === dateStr
      );
      setFilteredShifts(relevant);
    } else {
      setFilteredShifts([]);
    }
  }, [guardName, selectedDate, shifts]);

  const handleGuardNameChange = (selectedName: string) => {
    setGuardName(selectedName);
    // Find the corresponding guard ID
    const selectedGuard = guards.find(guard => guard.name === selectedName);
    if (selectedGuard) {
      setGuardId(selectedGuard.id);
    }
  };

  const handleConfirmation = async (shift: Shift, confirmed: boolean) => {
    // guardId from state is the one selected in dropdown.
    // For shift_activities, we need auth.uid() due to RLS.
    // The existing confirmShift API might handle its own auth or use the passed guardId.

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to confirm shifts.");
      return;
    }
    const authenticatedUserId = user.id;

    // Note: The existing guardId from dropdown is used for the confirmShift API
    // This might need reconciliation if confirmShift also expects auth.uid() implicitly
    if (!guardId.trim() && !authenticatedUserId) { // Check both if one could be empty
      toast.error('Guard information is missing.');
      return;
    }

    try {
      // Existing call to update rota (presumably)
      const response = await confirmShift({
        guardId: guardId.trim(), // guardId from dropdown selection
        guardName: guardName,    // guardName from dropdown selection
        date: shift.date,
        shiftId: shift.id,
        confirmed
      });

      if (response.status === 'ok') {
        toast.success(confirmed ? 'Shift confirmed!' : 'Shift declined');

        // Now, log to shift_activities using authenticated user's ID
        const activityType = confirmed ? 'Shift Confirmed' : 'Shift Declined';
        const notes = `${activityType} for position ${shift.position} from ${shift.startTime} to ${shift.endTime}. Original Guard in Rota: ${guardName} (ID: ${guardId})`;

        const { error: activityError } = await supabase
          .from('shift_activities')
          .insert({
            guard_id: authenticatedUserId, // This MUST be auth.uid() due to RLS
            activity_type: activityType,
            "timestamp": new Date().toISOString(),
            shift_id: shift.id, // Assuming shift.id is the UUID for the shift
            site_id: shift.siteId || null, // Assuming shift.siteId exists
            notes: notes,
          });

        if (activityError) {
          console.error('Error logging shift activity:', activityError);
          toast.error(`Confirmation saved, but failed to log activity: ${activityError.message}`);
        } else {
          toast.info("Shift activity logged.");
        }

        // Reload confirmations from localStorage (or wherever loadConfirmations reads from)
        const updatedConfirmations = loadConfirmations();
        setConfirmations(updatedConfirmations);
      } else {
        toast.error(response.message || 'Failed to update confirmation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Error updating confirmation: ${errorMessage}`);
      console.error('Confirmation error:', error);
    }
  };

  const getConfirmationStatus = (shift: Shift) => {
    const confirmation = confirmations.find(c => 
      c.guardId === guardId && 
      c.date === shift.date && 
      c.shiftId === shift.id
    );
    return confirmation;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Shift Confirmation</h1>
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Guard Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardName">Guard Name</Label>
                <Select onValueChange={handleGuardNameChange} value={guardName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select guard name" />
                  </SelectTrigger>
                  <SelectContent>
                    {guards.map((guard) => (
                      <SelectItem key={guard.id} value={guard.name}>
                        {guard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <div className="mt-2">
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredShifts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Shifts for {selectedDate?.toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredShifts.map((shift) => {
                  const confirmation = getConfirmationStatus(shift);
                  return (
                    <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{shift.position}</div>
                        <div className="text-sm text-muted-foreground">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {confirmation ? (
                          <Badge variant={confirmation.confirmed ? "default" : "destructive"}>
                            {confirmation.confirmed ? "Confirmed" : "Declined"}
                          </Badge>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleConfirmation(shift, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleConfirmation(shift, false)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {guardName && selectedDate && filteredShifts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No shifts found for {guardName} on {selectedDate.toLocaleDateString()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShiftConfirm;
