
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Save, Home } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shift, guards } from '@/data/rota-data';
import { loadRotaData } from '@/utils/rotaStore';
import { updateRotaData } from '@/api/rota-update';

const RotaBuilder = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [newShift, setNewShift] = useState<{
    guardName: string;
    date: Date | undefined;
    startTime: string;
    endTime: string;
    position: string;
  }>({
    guardName: '',
    date: undefined,
    startTime: '',
    endTime: '',
    position: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing rota data
    const existingShifts = loadRotaData();
    setShifts(existingShifts);
  }, []);

  const addShift = () => {
    if (!newShift.guardName || !newShift.date || !newShift.startTime || !newShift.endTime || !newShift.position) {
      toast.error('Please fill in all fields');
      return;
    }

    // Find the guard ID based on the selected name
    const selectedGuard = guards.find(guard => guard.name === newShift.guardName);
    const guardId = selectedGuard ? selectedGuard.id : crypto.randomUUID();

    const shift: Shift = {
      id: crypto.randomUUID(),
      guardId: guardId,
      guardName: newShift.guardName,
      date: newShift.date.toISOString().split('T')[0],
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      position: newShift.position,
      shiftType: 'Day', // Default to Day shift
      breakTimes: [
        { breakStart: '12:00', breakEnd: '12:30', breakType: 'Lunch' }
      ] // Default break time
    };

    setShifts([...shifts, shift]);
    setNewShift({
      guardName: '',
      date: undefined,
      startTime: '',
      endTime: '',
      position: ''
    });
    toast.success('Shift added');
  };

  const removeShift = (id: string) => {
    setShifts(shifts.filter(shift => shift.id !== id));
    toast.success('Shift removed');
  };

  const saveRota = async () => {
    setIsLoading(true);
    try {
      const response = await updateRotaData({ rows: shifts });
      if (response.status === 'ok') {
        toast.success('Rota saved successfully');
      } else {
        toast.error(response.message || 'Failed to save rota');
      }
    } catch (error) {
      toast.error('Error saving rota');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Rota Builder</h1>
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add New Shift</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guardName">Guard Name</Label>
                <Select onValueChange={(value) => setNewShift({ ...newShift, guardName: value })} value={newShift.guardName}>
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
                    value={newShift.date}
                    onChange={(date) => setNewShift({ ...newShift, date })}
                  />
                </div>
              </div>

              <div>
                <Label>Start Time</Label>
                <div className="mt-2">
                  <TimePicker
                    value={newShift.startTime}
                    onChange={(time) => setNewShift({ ...newShift, startTime: time })}
                  />
                </div>
              </div>

              <div>
                <Label>End Time</Label>
                <div className="mt-2">
                  <TimePicker
                    value={newShift.endTime}
                    onChange={(time) => setNewShift({ ...newShift, endTime: time })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={newShift.position}
                  onChange={(e) => setNewShift({ ...newShift, position: e.target.value })}
                  placeholder="e.g., Main Gate, Reception, Patrol"
                />
              </div>

              <Button onClick={addShift} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Current Shifts ({shifts.length})
                <Button onClick={saveRota} disabled={isLoading || shifts.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Rota'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No shifts added yet</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guard</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium">{shift.guardName}</TableCell>
                          <TableCell>{shift.date}</TableCell>
                          <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                          <TableCell>{shift.position}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeShift(shift.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
    </div>
  );
};

export default RotaBuilder;
