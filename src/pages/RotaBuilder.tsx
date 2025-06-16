
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Shift, guards } from '@/data/rota-data';
import { loadRotaData, saveRotaData } from '@/utils/rotaStore';
import { updateRotaData } from '@/api/rota-update';

const RotaBuilder = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    guardId: '',
    guardName: '',
    date: '',
    startTime: '',
    endTime: '',
    position: '',
    shiftType: 'Day',
    breakTimes: []
  });

  useEffect(() => {
    // Load existing rota data
    const existingShifts = loadRotaData();
    if (existingShifts.length > 0) {
      setShifts(existingShifts);
    }
  }, []);

  const handleGuardChange = (guardId: string) => {
    const guard = guards.find(g => g.id === guardId);
    setNewShift(prev => ({
      ...prev,
      guardId,
      guardName: guard?.name || ''
    }));
  };

  const addShift = () => {
    if (!newShift.guardId || !newShift.date || !newShift.startTime || !newShift.endTime || !newShift.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    const shift: Shift = {
      id: crypto.randomUUID(),
      guardId: newShift.guardId!,
      guardName: newShift.guardName!,
      date: newShift.date!,
      startTime: newShift.startTime!,
      endTime: newShift.endTime!,
      position: newShift.position!,
      shiftType: newShift.shiftType as 'Day' | 'Night' | 'Evening',
      breakTimes: []
    };

    setShifts(prev => [...prev, shift]);
    setNewShift({
      guardId: '',
      guardName: '',
      date: '',
      startTime: '',
      endTime: '',
      position: '',
      shiftType: 'Day',
      breakTimes: []
    });

    toast.success('Shift added successfully');
  };

  const removeShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    toast.success('Shift removed');
  };

  const saveRota = async () => {
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
    }
  };

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
          <h1 className="text-3xl font-bold">Rota Builder</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add New Shift Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Shift
              </CardTitle>
              <CardDescription>Create a new shift assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guard">Guard</Label>
                <Select value={newShift.guardId} onValueChange={handleGuardChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a guard" />
                  </SelectTrigger>
                  <SelectContent>
                    {guards.map(guard => (
                      <SelectItem key={guard.id} value={guard.id}>
                        {guard.name} - {guard.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  placeholder="e.g., Main Entrance, Reception Desk"
                  value={newShift.position}
                  onChange={(e) => setNewShift(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="shiftType">Shift Type</Label>
                <Select value={newShift.shiftType} onValueChange={(value: 'Day' | 'Night' | 'Evening') => 
                  setNewShift(prev => ({ ...prev, shiftType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={addShift} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
              </Button>
            </CardContent>
          </Card>

          {/* Current Shifts Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Current Rota</CardTitle>
              <CardDescription>{shifts.length} shifts scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">
                  Total shifts: {shifts.length}
                </span>
                <Button onClick={saveRota} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Rota
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {shifts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No shifts added yet</p>
                ) : (
                  shifts.map(shift => (
                    <div key={shift.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <div className="font-medium">{shift.guardName}</div>
                        <div className="text-muted-foreground">
                          {shift.date} • {shift.startTime}-{shift.endTime} • {shift.position}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeShift(shift.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Shifts Table */}
        {shifts.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detailed Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guard</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map(shift => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.guardName}</TableCell>
                      <TableCell>{shift.date}</TableCell>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RotaBuilder;
