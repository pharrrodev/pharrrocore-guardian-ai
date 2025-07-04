
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
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import dayjs from 'dayjs'; // For date formatting

// Define Shift interface matching Supabase table structure
// Note: `date` in UI might be Date object, but Supabase needs 'YYYY-MM-DD' string for DATE type.
// `breakTimes` will be JSON.
export interface Shift {
  id: string; // client-generated UUID
  guard_id: string; // UUID from auth.users
  guard_name: string;
  shift_date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  position: string;
  shift_type: 'Day' | 'Night' | 'Evening';
  break_times?: Array<{ breakStart: string; breakEnd: string; breakType: string }>;
  site_id?: string | null;
  // created_at and updated_at are handled by Supabase
}

interface GuardUser { // For availableGuards state
  id: string;
  name: string;
}

// Type for the data items returned by the 'get-guard-list' Supabase function
interface GuardListDataItem {
  id: string;
  name?: string;
  email?: string;
}

type NewShiftFormValue = string | Date | undefined | 'Day' | 'Night' | 'Evening';


const RotaBuilder = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [newShiftForm, setNewShiftForm] = useState<{
    guard_id: string; // Stores selected guard's Supabase UUID
    guard_name: string; // Stores selected guard's display name
    shift_date_obj: Date | undefined; // For DatePicker component
    start_time: string;
    end_time: string;
    position: string;
    shift_type: 'Day' | 'Night' | 'Evening';
  }>({
    guard_id: '',
    guard_name: '',
    shift_date_obj: undefined,
    start_time: '',
    end_time: '',
    position: '',
    shift_type: 'Day',
  });

  const [availableGuards, setAvailableGuards] = useState<GuardUser[]>([]);
  const [isLoadingGuards, setIsLoadingGuards] = useState(true);
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch guards
  useEffect(() => {
    const fetchGuards = async () => {
      setIsLoadingGuards(true);
      try {
        const { data: guardsData, error } = await supabase.functions.invoke('get-guard-list');
        if (error) throw error;
        if (guardsData && Array.isArray(guardsData)) {
          setAvailableGuards(guardsData.map((g: GuardListDataItem) => ({
            id: g.id,
            name: g.name || g.email || `User ${g.id.substring(0,6)}`
          })));
        } else {
          setAvailableGuards([]);
        }
      } catch (err) {
        console.error("Error fetching guards:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        toast.error(`Failed to load guard list: ${errorMessage}`);
        setAvailableGuards([]);
      } finally {
        setIsLoadingGuards(false);
      }
    };
    fetchGuards();
  }, []);

  // Fetch existing shifts
  useEffect(() => {
    const fetchShifts = async () => {
      setIsLoadingShifts(true);
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .order('shift_date', { ascending: true })
          .order('start_time', { ascending: true });
        if (error) throw error;
        // Ensure break_times is parsed if it's stored as a string, though JSONB handles objects.
        // And ensure shift_date is in 'YYYY-MM-DD' if it's not already.
        setShifts(data || []);
      } catch (err) {
        console.error("Error fetching shifts:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        toast.error(`Failed to load existing shifts: ${errorMessage}`);
        setShifts([]);
      } finally {
        setIsLoadingShifts(false);
      }
    };
    fetchShifts();
  }, []);

  const handleNewShiftFormChange = (field: keyof typeof newShiftForm, value: NewShiftFormValue) => {
    setNewShiftForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardSelectionForNewShift = (guardId: string) => {
    const selectedGuard = availableGuards.find(g => g.id === guardId);
    setNewShiftForm(prev => ({
      ...prev,
      guard_id: guardId,
      guard_name: selectedGuard ? selectedGuard.name : '',
    }));
  };

  const addShift = () => {
    if (!newShiftForm.guard_id || !newShiftForm.shift_date_obj || !newShiftForm.start_time || !newShiftForm.end_time || !newShiftForm.position || !newShiftForm.shift_type) {
      toast.error('Please fill in all required fields for the new shift.');
      return;
    }

    const newShiftEntry: Shift = {
      id: crypto.randomUUID(),
      guard_id: newShiftForm.guard_id,
      guard_name: newShiftForm.guard_name,
      shift_date: dayjs(newShiftForm.shift_date_obj).format('YYYY-MM-DD'),
      start_time: newShiftForm.start_time,
      end_time: newShiftForm.end_time,
      position: newShiftForm.position,
      shift_type: newShiftForm.shift_type,
      break_times: [ // Default break times
        { breakStart: '12:00', breakEnd: '12:30', breakType: 'Lunch' },
        // Add more default breaks if needed based on shift_type
      ],
      // site_id: null, // Set if site context is available
    };

    setShifts([...shifts, newShiftEntry]);
    // Reset form
    setNewShiftForm({
      guard_id: '',
      guard_name: '',
      shift_date_obj: undefined,
      start_time: '',
      end_time: '',
      position: '',
      shift_type: 'Day',
    });
    toast.success('Shift added to current rota. Save rota to persist changes.');
  };

  const removeShift = (id: string) => {
    setShifts(shifts.filter(shift => shift.id !== id));
    toast.info('Shift removed from current rota. Save rota to persist changes.');
  };

  const saveRota = async () => {
    if (shifts.length === 0) {
      toast.info("No shifts to save.");
      // Optionally, you might want to delete all shifts for the relevant date range/guards if this means clearing the rota.
      // For now, we only upsert what's in the local state.
      return;
    }
    setIsSaving(true);
    try {
      // Map local state `shifts` to ensure structure matches DB table exactly
      // (e.g. `shift_date` is string 'YYYY-MM-DD')
      const shiftsToUpsert = shifts.map(s => ({
        ...s,
        // Ensure shift_date is correctly formatted if it was a Date object locally at some point
        shift_date: dayjs(s.shift_date).format('YYYY-MM-DD'),
      }));

      const { error } = await supabase.from('shifts').upsert(shiftsToUpsert, {
        onConflict: 'id', // Use the client-generated UUID as the conflict target
      });

      if (error) {
        console.error('Error saving rota to Supabase:', error);
        toast.error(`Failed to save rota: ${error.message}`);
        throw error;
      }
      toast.success('Rota saved successfully to Supabase!');
    } catch (error) {
      // Error already handled by toast in the upsert block or if it's a different error
      console.error('Save rota error:', error);
    } finally {
      setIsSaving(false);
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
                <Select onValueChange={handleGuardSelectionForNewShift} value={newShiftForm.guard_id}>
                  <SelectTrigger id="guardName">
                    <SelectValue placeholder="Select guard name" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingGuards ? (
                      <SelectItem value="loading" disabled>Loading guards...</SelectItem>
                    ) : availableGuards.length > 0 ? (
                      availableGuards.map((guard) => (
                        <SelectItem key={guard.id} value={guard.id}>
                          {guard.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-guards" disabled>No guards available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date</Label>
                <div className="mt-2">
                  <DatePicker
                    value={newShiftForm.shift_date_obj}
                    onChange={(date) => handleNewShiftFormChange('shift_date_obj', date)}
                  />
                </div>
              </div>

              <div>
                <Label>Start Time</Label>
                <div className="mt-2">
                  <TimePicker
                    value={newShiftForm.start_time}
                    onChange={(time) => handleNewShiftFormChange('start_time', time as string)}
                  />
                </div>
              </div>

              <div>
                <Label>End Time</Label>
                <div className="mt-2">
                  <TimePicker
                    value={newShiftForm.end_time}
                    onChange={(time) => handleNewShiftFormChange('end_time', time as string)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={newShiftForm.position} // Use newShiftForm
                  onChange={(e) => handleNewShiftFormChange('position', e.target.value)}
                  placeholder="e.g., Main Gate, Reception, Patrol"
                />
              </div>

              <div>
                <Label htmlFor="shiftType">Shift Type</Label>
                <Select
                  value={newShiftForm.shift_type}
                  onValueChange={(value: 'Day' | 'Night' | 'Evening') => handleNewShiftFormChange('shift_type', value)}
                >
                  <SelectTrigger id="shiftType">
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Break times are defaulted in addShift, UI for editing them is a future enhancement */}

              <Button onClick={addShift} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Current Rota ({shifts.length} shifts)
                <Button onClick={saveRota} disabled={isSaving || isLoadingShifts || shifts.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Rota to Database'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingShifts ? (
                <p className="text-muted-foreground text-center py-8">Loading shifts...</p>
              ) : shifts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No shifts added yet. Add shifts using the form on the left, then click "Save Rota".</p>
              ) : (
                <div className="max-h-[500px] overflow-auto"> {/* Increased max-h */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guard</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium">{shift.guard_name}</TableCell>
                          <TableCell>{dayjs(shift.shift_date).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>{shift.start_time} - {shift.end_time}</TableCell>
                          <TableCell>{shift.position}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              shift.shift_type === 'Day' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                              shift.shift_type === 'Evening' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' // Night
                            }`}>
                              {shift.shift_type}
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
