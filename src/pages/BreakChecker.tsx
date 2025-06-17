
import React, { useState, useEffect } from 'react'; // Added useEffect
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep for fallback if needed, but Select is primary
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Coffee, Home, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { checkBreakStatus } from '@/api/break-check';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase
import { toast } from 'sonner'; // Import sonner toast
import dayjs from 'dayjs'; // Import dayjs for current time
import { loadRotaData, Shift } from '@/utils/rotaStore'; // For guard names
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select

const BreakChecker = () => {
  const [guardName, setGuardName] = useState(''); // This will store the selected guard's name
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Default to today
  const [currentTime, setCurrentTime] = useState<string>(dayjs().format('HH:mm')); // Default to current time
  const [breakStatus, setBreakStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableGuards, setAvailableGuards] = useState<string[]>([]);

  useEffect(() => {
    const rota = loadRotaData();
    const uniqueGuardNames = Array.from(new Set(rota.map((shift: Shift) => shift.guardName))).sort();
    setAvailableGuards(uniqueGuardNames);
    if (uniqueGuardNames.length > 0 && !guardName) {
      // Optionally pre-select first guard or leave empty
      // setGuardName(uniqueGuardNames[0]);
    }
  }, [guardName]); // Re-run if guardName changes to allow clearing if needed

  const checkBreak = async () => {
    if (!guardName || !selectedDate || !currentTime) {
      toast.error("Please select guard, date, and time.");
      return;
    }

    setIsLoading(true);
    setBreakStatus(null); // Clear previous status
    let result; // To store result from checkBreakStatus

    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD'); // Format date correctly
      result = await checkBreakStatus({
        guardName: guardName.trim(),
        date: dateStr,
        currentTime
      });
      setBreakStatus(result);

      // Log the check to Supabase (best-effort)
      const { data: { user: checkerUser } } = await supabase.auth.getUser();
      if (checkerUser && result) { // Ensure result is available
        const logData = {
          queried_guard_name: guardName.trim(),
          queried_date: dateStr,
          queried_time: currentTime,
          status_on_break: result.onBreak,
          status_message: result.message,
          user_id_performing_check: checkerUser.id,
          // site_id: null, // Add if site context becomes available
        };
        const { error: logError } = await supabase.from('break_check_queries').insert(logData);
        if (logError) {
          console.error("Error logging break check query:", logError);
          toast.warning("Break status checked, but failed to log the query action.");
        } else {
          toast.info("Break check query logged.");
        }
      } else if (!checkerUser) {
        toast.warning("Break status checked, but could not log query (user not authenticated).");
      }

    } catch (error) {
      console.error('Error checking break status:', error);
      toast.error("Failed to check break status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Break Time Checker</h1>
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
              Check Break Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="guardNameSelect">Guard Name</Label>
              <Select value={guardName} onValueChange={setGuardName}>
                <SelectTrigger id="guardNameSelect">
                  <SelectValue placeholder="Select guard name" />
                </SelectTrigger>
                <SelectContent>
                  {availableGuards.length > 0 ? (
                    availableGuards.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">No guards found in rota.</div>
                  )}
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

            <div>
              <Label>Current Time</Label>
              <div className="mt-2">
                <TimePicker
                  value={currentTime}
                  onChange={setCurrentTime}
                />
              </div>
            </div>

            <Button 
              onClick={checkBreak} 
              className="w-full"
              disabled={!guardName || !selectedDate || !currentTime || isLoading}
            >
              <Clock className="w-4 h-4 mr-2" />
              {isLoading ? 'Checking...' : 'Check Break Status'}
            </Button>
          </CardContent>
        </Card>

        {breakStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                Break Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={breakStatus.onBreak ? "default" : "secondary"}>
                    {breakStatus.onBreak ? "On Break" : "Not on Break"}
                  </Badge>
                </div>

                {breakStatus.message && (
                  <p className="text-muted-foreground">{breakStatus.message}</p>
                )}

                {breakStatus.nextBreak && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Next Break:</div>
                    <div className="text-sm text-muted-foreground">
                      {breakStatus.nextBreak.startTime} - {breakStatus.nextBreak.endTime}
                      {breakStatus.nextBreak.position && ` (${breakStatus.nextBreak.position})`}
                    </div>
                  </div>
                )}

                {breakStatus.currentShift && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">Current Shift:</div>
                    <div className="text-sm text-muted-foreground">
                      {breakStatus.currentShift.startTime} - {breakStatus.currentShift.endTime}
                      {breakStatus.currentShift.position && ` (${breakStatus.currentShift.position})`}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BreakChecker;
