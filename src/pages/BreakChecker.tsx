
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
import { checkBreakStatus, BreakCheckResponse } from '@/api/break-check'; // Import BreakCheckResponse
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import { toast } from 'sonner'; // Import sonner toast
import dayjs from 'dayjs'; // Import dayjs for current time
// Removed: import { loadRotaData, Shift } from '@/utils/rotaStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select

// Interface for guards fetched from Edge Function
interface GuardUser {
  id: string; // Supabase auth user ID
  name: string; // Display name
}

// Type for the data items returned by the 'get-guard-list' Supabase function
interface GuardListDataItem {
  id: string;
  name?: string;
  email: string;
}

const BreakChecker = () => {
  // State for selected guard's details
  const [selectedGuardForQuery, setSelectedGuardForQuery] = useState<{ id: string | null; name: string }>({ id: null, name: '' });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date()); // Default to today
  const [currentTime, setCurrentTime] = useState<string>(dayjs().format('HH:mm')); // Default to current time
  const [breakStatus, setBreakStatus] = useState<BreakCheckResponse | null>(null); // Use BreakCheckResponse
  const [isLoading, setIsLoading] = useState(false);
  const [availableGuards, setAvailableGuards] = useState<GuardUser[]>([]);
  const [isLoadingGuards, setIsLoadingGuards] = useState(true);


  useEffect(() => {
    const fetchGuards = async () => {
      setIsLoadingGuards(true);
      try {
        const { data: guardsData, error } = await supabase.functions.invoke('get-guard-list');
        if (error) throw error;
        if (guardsData && Array.isArray(guardsData)) {
          setAvailableGuards(guardsData.map((g: GuardListDataItem) => ({
            id: g.id,
            name: g.name || g.email || `User ${g.id.substring(0,6)}` // Fallback for name
          })));
        } else {
          setAvailableGuards([]);
        }
      } catch (err) {
        console.error("Error fetching guards:", err);
        toast.error("Failed to load guard list.");
        setAvailableGuards([]);
      } finally {
        setIsLoadingGuards(false);
      }
    };
    fetchGuards();
  }, []);

  const handleGuardSelection = (guardId: string) => {
    const selected = availableGuards.find(g => g.id === guardId);
    if (selected) {
      setSelectedGuardForQuery({ id: selected.id, name: selected.name });
    }
  };

  const checkBreak = async () => {
    if (!selectedGuardForQuery.name || !selectedDate || !currentTime) {
      toast.error("Please select guard, date, and time.");
      return;
    }

    setIsLoading(true);
    setBreakStatus(null); // Clear previous status
    let result: BreakCheckResponse; // Use BreakCheckResponse

    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      result = await checkBreakStatus({
        guardId: selectedGuardForQuery.id, // Pass the UUID
        guardName: selectedGuardForQuery.name, // Pass the name
        date: dateStr,
        currentTime
      });
      setBreakStatus(result);

      // Log the check to Supabase (best-effort)
      const { data: { user: checkerUser } } = await supabase.auth.getUser();
      if (checkerUser && result) {
        const logData = {
          queried_guard_user_id: selectedGuardForQuery.id,
          queried_guard_name: selectedGuardForQuery.name,
          queried_date: dateStr,
          queried_time: currentTime,
          status_on_break: result.onBreak,
          status_message: result.message,
          shift_id_checked: result.shift_id_checked || null, // Get from API response
          user_id_performing_check: checkerUser.id,
          // site_id: null,
        };
        const { error: logError } = await supabase.from('break_check_queries').insert(logData);
        if (logError) {
          console.error("Error logging break check query:", logError);
          toast.warning("Break status checked, but failed to log the query action.");
        } else {
          // toast.info("Break check query logged."); // Optional toast
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
              <Select
                value={selectedGuardForQuery.id || ""}
                onValueChange={handleGuardSelection}
                disabled={isLoadingGuards}
              >
                <SelectTrigger id="guardNameSelect">
                  <SelectValue placeholder="Select guard name" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingGuards ? (
                     <div className="p-2 text-sm text-muted-foreground">Loading guards...</div>
                  ) : availableGuards.length > 0 ? (
                    availableGuards.map(guard => (
                      <SelectItem key={guard.id} value={guard.id}>{guard.name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No guards available.</div>
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
              disabled={!selectedGuardForQuery.name || !selectedDate || !currentTime || isLoading}
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
