import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Radio, Handshake, ArrowLeft, Check, Users } from 'lucide-react';
import { logRadioHandover } from '../api/radio-handover';
import { supabase } from '@/lib/supabaseClient';
import dayjs from 'dayjs';

interface GuardUser {
  id: string;
  name: string;
}

interface LogEntry {
  id: string;
  action: 'radio' | 'handover';
  log_timestamp: string;
  guard_id: string;
  guard_name_logged: string;
}

const RadioHandover = () => {
  const [guardUsers, setGuardUsers] = useState<GuardUser[]>([]);
  const [selectedGuardSupabaseId, setSelectedGuardSupabaseId] = useState<string>('');
  const [selectedGuardName, setSelectedGuardName] = useState<string>('');
  const [todaysLogs, setTodaysLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGuards, setIsFetchingGuards] = useState(true);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  // Fetch guard users
  useEffect(() => {
    const fetchGuards = async () => {
      setIsFetchingGuards(true);
      try {
        // Invoke the Edge Function to get the list of guards/users
        const { data: guardsData, error: functionsError } = await supabase.functions.invoke('get-guard-list');

        if (functionsError) {
          console.error("Error fetching guards via Edge Function:", functionsError);
          toast.error("Failed to load guards list. Please try again later.");
          setGuardUsers([]);
        } else if (guardsData) {
          // Map to GuardUser interface {id, name}
          const formattedGuards = guardsData.map((g: any) => ({
            id: g.id,
            name: g.name || g.email, // Use name, fallback to email
          }));
          setGuardUsers(formattedGuards);
        } else {
          // No data and no error, unlikely but handle it
          setGuardUsers([]);
          // The missing semicolon has been added to this line to fix the build error.
          console.warn("No guards data returned from Edge Function, and no error reported.");
        }
      } catch (err) {
        // Catch any other client-side errors during the fetch process
        console.error("Client-side error in fetchGuards:", err);
        toast.error("An unexpected error occurred while loading guards.");
        setGuardUsers([]);
      } finally {
        setIsFetchingGuards(false);
      }
    };
    fetchGuards();
  }, []);

  // Fetch today's logs for the selected guard
  useEffect(() => {
    if (!selectedGuardSupabaseId) {
      setTodaysLogs([]);
      return;
    }
    const fetchLogsForGuard = async () => {
      setIsFetchingLogs(true);
      const todayStart = dayjs().startOf('day').toISOString();
      const todayEnd = dayjs().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('radio_handover_logs')
        .select('*')
        .eq('guard_id', selectedGuardSupabaseId)
        .gte('log_timestamp', todayStart)
        .lte('log_timestamp', todayEnd);

      if (error) {
        console.error("Error fetching today's logs:", error);
        toast.error("Failed to fetch today's logs.");
        setTodaysLogs([]);
      } else {
        setTodaysLogs(data || []);
      }
      setIsFetchingLogs(false);
    };
    fetchLogsForGuard();
  }, [selectedGuardSupabaseId]);

  const handleGuardSelection = (guardSupabaseId: string) => {
    setSelectedGuardSupabaseId(guardSupabaseId);
    const guard = guardUsers.find(g => g.id === guardSupabaseId);
    setSelectedGuardName(guard ? guard.name : 'Unknown Guard');
  };

  const handleAction = async (action: 'radio' | 'handover') => {
    if (!selectedGuardSupabaseId) {
      toast.error('Please select a guard first');
      return;
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast.error('You must be logged in to perform this action.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await logRadioHandover({
        guard_id: selectedGuardSupabaseId,
        guard_name_logged: selectedGuardName,
        action,
        user_id_performed_log: currentUser.id,
      });

      if (response.status === 'ok') {
        toast.success(`${action === 'radio' ? 'Radio test' : 'Handover'} logged successfully for ${selectedGuardName}`);
        const todayStart = dayjs().startOf('day').toISOString();
        const todayEnd = dayjs().endOf('day').toISOString();
        const { data: updatedLogsData, error: refetchError } = await supabase
          .from('radio_handover_logs')
          .select('*')
          .eq('guard_id', selectedGuardSupabaseId)
          .gte('log_timestamp', todayStart)
          .lte('log_timestamp', todayEnd);
        if (refetchError) throw refetchError;
        setTodaysLogs(updatedLogsData || []);
      } else {
        toast.error(response.message || 'Failed to log action');
      }
    } catch (error: any) {
      toast.error(`Failed to log action: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const hasLoggedRadio = todaysLogs.some(log => log.action === 'radio');
  const hasLoggedHandover = todaysLogs.some(log => log.action === 'handover');

  const lastRadioLog = todaysLogs.filter(log => log.action === 'radio').sort((a, b) => dayjs(b.log_timestamp).diff(dayjs(a.log_timestamp))).shift();
  const lastHandoverLog = todaysLogs.filter(log => log.action === 'handover').sort((a, b) => dayjs(b.log_timestamp).diff(dayjs(a.log_timestamp))).shift();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Radio & Handover Tracker</h1>
            <p className="text-muted-foreground">Log your radio tests and handover completion</p>
          </div>
        </header>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Guard</CardTitle>
              <CardDescription>Choose the guard to log actions for</CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingGuards ? (
                <p>Loading guards...</p>
              ) : guardUsers.length === 0 ? (
                <p className="text-muted-foreground">No guards found or could not load guard list.</p>
              ) : (
                <RadioGroup value={selectedGuardSupabaseId} onValueChange={handleGuardSelection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {guardUsers.map((guard) => (
                      <div key={guard.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                        <RadioGroupItem value={guard.id} id={guard.id} />
                        <label htmlFor={guard.id} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {guard.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {selectedGuardSupabaseId && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className={hasLoggedRadio ? 'border-green-500 bg-green-50 dark:bg-green-950/70' : ''}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Radio className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Radio Test
                          {hasLoggedRadio && <Check className="h-5 w-5 text-green-600" />}
                        </CardTitle>
                        <CardDescription>
                          {hasLoggedRadio
                            ? `Completed at ${dayjs(lastRadioLog?.log_timestamp).format('HH:mm')}`
                            : 'Press to confirm radio is working'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleAction('radio')}
                      disabled={isLoading || isFetchingLogs}
                      className="w-full"
                      variant={hasLoggedRadio ? "secondary" : "default"}
                    >
                      {hasLoggedRadio ? 'Radio Test Logged' : 'Log Radio Test Passed'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className={hasLoggedHandover ? 'border-green-500 bg-green-50 dark:bg-green-950/70' : ''}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Handshake className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Handover
                          {hasLoggedHandover && <Check className="h-5 w-5 text-green-600" />}
                        </CardTitle>
                        <CardDescription>
                          {hasLoggedHandover
                            ? `Completed at ${dayjs(lastHandoverLog?.log_timestamp).format('HH:mm')}`
                            : 'Press to confirm handover complete'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleAction('handover')}
                      disabled={isLoading || isFetchingLogs}
                      className="w-full"
                      variant={hasLoggedHandover ? "secondary" : "default"}
                    >
                      {hasLoggedHandover ? 'Handover Logged' : 'Log Handover Complete'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Today's Status for {selectedGuardName || "Selected Guard"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isFetchingLogs ? <p>Loading logs...</p> : (
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className={`p-4 rounded-lg ${hasLoggedRadio ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                        <div className="text-2xl font-bold">
                          {hasLoggedRadio ? '✓' : '○'}
                        </div>
                        <div className="text-sm">Radio Test</div>
                      </div>
                      <div className={`p-4 rounded-lg ${hasLoggedHandover ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                        <div className="text-2xl font-bold">
                          {hasLoggedHandover ? '✓' : '○'}
                        </div>
                        <div className="text-sm">Handover</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="outline" asChild>
                  <Link to="/radio-handover-log">View All Logs</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RadioHandover;
