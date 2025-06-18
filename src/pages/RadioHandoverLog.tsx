
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For filter
import { ArrowLeft, Radio, Handshake, RefreshCw, UserCircle, Users } from 'lucide-react';
// Removed: import { getLogsFromStorage, RadioHandoverLogEntry } from '../utils/appendCsv';
// Removed: import { rotaData } from '../data/rota-data';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import dayjs from 'dayjs';
import { toast } from 'sonner';

interface SupabaseRadioHandoverLog {
  id: string;
  guard_id: string | null;
  guard_name_logged: string;
  action: 'radio' | 'handover';
  log_timestamp: string;
  user_id_performed_log: string;
  site_id: string | null;
  created_at: string;
  guard_user: { email?: string; user_metadata?: { full_name?: string } } | null; // For guard_id join
  logger_user: { email?: string; user_metadata?: { full_name?: string } } | null; // For user_id_performed_log join
}

const RadioHandoverLog = () => {
  const [logs, setLogs] = useState<SupabaseRadioHandoverLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [guardNameFilter, setGuardNameFilter] = useState<string>('');


  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('radio_handover_logs')
        .select(`
          *,
          guard_user:guard_id ( email, user_metadata ),
          logger_user:user_id_performed_log ( email, user_metadata )
        `)
        .order('log_timestamp', { ascending: false });

      if (dateFilter) {
        const day = dayjs(dateFilter);
        query = query.gte('log_timestamp', day.startOf('day').toISOString())
                     .lte('log_timestamp', day.endOf('day').toISOString());
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (guardNameFilter.trim() !== '') {
        // Using ilike for case-insensitive search on guard_name_logged
        query = query.ilike('guard_name_logged', `%${guardNameFilter.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching radio/handover logs:", error);
        toast.error(`Failed to fetch logs: ${error.message}`);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (e) {
      console.error("Unexpected error fetching logs:", e);
      toast.error("An unexpected error occurred.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, actionFilter, guardNameFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // const getShiftStartTime = (guardId: string, date: string): string | null => {
  //   // This function needs to be refactored to fetch from Supabase 'rota' table.
  //   // For now, it's disabled as rotaData is static and likely out of sync.
  //   // const shift = rotaData.find(s => s.guardId === guardId && s.date === date);
  //   // return shift ? shift.startTime : null;
  //   return null; // Temporarily disable
  // };

  // const isRadioTestLate = (log: SupabaseRadioHandoverLog): boolean => {
  //   // This logic is temporarily disabled until rota data is available from Supabase.
  //   // if (log.action !== 'radio') return false;
  //   // const logDate = dayjs(log.log_timestamp).format('YYYY-MM-DD');
  //   // const shiftStartTime = getShiftStartTime(log.guard_id || '', logDate); // guard_id could be null
  //   // if (!shiftStartTime) return false;
  //   // const shiftStart = dayjs(`${logDate} ${shiftStartTime}`);
  //   // const logTime = dayjs(log.log_timestamp);
  //   // const timeDiff = logTime.diff(shiftStart, 'minute');
  //   // return timeDiff > 5; // More than 5 minutes after shift start
  //   return false; // Temporarily disable
  // };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto"> {/* Increased max-width for more columns */}
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/radio-handover">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold">Radio & Handover Logs</h1>
              <p className="text-muted-foreground text-sm sm:text-base">View all radio test and handover completion logs</p>
            </div>
          </div>
           <Button onClick={fetchLogs} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Log'}
          </Button>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dateFilter" className="block text-sm font-medium mb-1">Date</label>
              <Input
                id="dateFilter" type="date" value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="actionFilter" className="block text-sm font-medium mb-1">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="actionFilter">
                  <SelectValue placeholder="Filter by action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="radio">Radio Tests</SelectItem>
                  <SelectItem value="handover">Handovers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="guardNameFilter" className="block text-sm font-medium mb-1">Guard Name</label>
              <Input
                id="guardNameFilter" type="text" value={guardNameFilter}
                onChange={(e) => setGuardNameFilter(e.target.value)}
                placeholder="Search guard name..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Entries</CardTitle>
            <CardDescription>{logs.length} {logs.length === 1 ? 'entry' : 'entries'} found.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center text-muted-foreground py-8">Loading logs...</p>}
            {!isLoading && logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No log entries found for the selected filters.</p>
            ) : !isLoading && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Guard Name</TableHead>
                      <TableHead>Guard ID (User)</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Logged By</TableHead>
                      {/* <TableHead>Status (Late Check)</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      // <TableRow key={log.id} className={isRadioTestLate(log) ? 'bg-red-50 dark:bg-red-950/30' : ''}>
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {dayjs(log.log_timestamp).format('MMM DD, YYYY')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {dayjs(log.log_timestamp).format('HH:mm:ss')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {log.guard_name_logged}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.guard_user?.user_metadata?.full_name || log.guard_user?.email || (log.guard_id ? 'N/A (User Deleted?)' : 'Not a system user')}
                          {log.guard_id && <div className="text-xs opacity-70">{log.guard_id}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.action === 'radio' ? (
                              <Radio className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Handshake className="h-4 w-4 text-green-500" />
                            )}
                            <span className="capitalize">{log.action === 'radio' ? 'Radio Test' : 'Handover'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <UserCircle className="w-4 h-4 text-muted-foreground" />
                              {log.logger_user?.user_metadata?.full_name || log.logger_user?.email || 'N/A'}
                           </div>
                        </TableCell>
                        {/* <TableCell>
                          { log.action === 'radio' ? (
                            isRadioTestLate(log) ? (
                              <span className="text-red-500 font-medium">Late Check</span>
                            ) : (
                              <span className="text-green-500 font-medium">On Time</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell> */}
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
  );
};

export default RadioHandoverLog;
