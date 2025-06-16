
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shift, guards } from '@/data/rota-data';
import { loadRotaData, loadConfirmations } from '@/utils/rotaStore';
import { confirmShift } from '@/api/rota-confirm';

const ShiftConfirm = () => {
  const [guardId, setGuardId] = useState('');
  const [guardName, setGuardName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [confirmations, setConfirmations] = useState<any[]>([]);
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
    if (!guardId.trim()) {
      toast.error('Please select a guard');
      return;
    }

    try {
      const response = await confirmShift({
        guardId: guardId.trim(),
        guardName: guardName,
        date: shift.date,
        shiftId: shift.id,
        confirmed
      });

      if (response.status === 'ok') {
        toast.success(confirmed ? 'Shift confirmed!' : 'Shift declined');
        // Reload confirmations
        const updatedConfirmations = loadConfirmations();
        setConfirmations(updatedConfirmations);
      } else {
        toast.error(response.message || 'Failed to update confirmation');
      }
    } catch (error) {
      toast.error('Error updating confirmation');
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
