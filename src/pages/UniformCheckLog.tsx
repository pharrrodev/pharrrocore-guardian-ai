import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, UserCircle, ListChecks, MessageSquare, CalendarDays } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

interface UniformCheckLogRow {
  id: string;
  check_timestamp: string;
  guard_name_checked: string;
  checker_user: { email?: string } | null; // Joined data
  checklist_items: Array<{ id: string; label: string; confirmed: boolean }>;
  additional_comments: string | null;
  // guard_user: { email?: string } | null; // If joining guard_id to users table
}

const UniformCheckLog = () => {
  const [logs, setLogs] = useState<UniformCheckLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('uniform_checks')
        .select(`
          id,
          check_timestamp,
          guard_name_checked,
          additional_comments,
          checklist_items,
          checker_user:checker_user_id ( email )
        `)
        .order('check_timestamp', { ascending: false });

      if (error) {
        console.error("Error fetching uniform check logs:", error);
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
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const countNonConfirmedItems = (items: Array<{ id: string; label: string; confirmed: boolean }>): number => {
    return items.filter(item => !item.confirmed).length;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/uniform-check">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Uniform Check</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Uniform Check Log</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                History of all submitted uniform checks.
              </p>
            </div>
          </div>
          <Button onClick={fetchLogs} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Log'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log Entries</CardTitle>
            <CardDescription>
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'} found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center text-muted-foreground py-8">Loading log entries...</p>}
            {!isLoading && logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No uniform checks have been logged yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/uniform-check">Perform First Check</Link>
                </Button>
              </div>
            ) : !isLoading && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Guard Name Checked</TableHead>
                      <TableHead>Issues Found</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Checked By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const nonConfirmedCount = countNonConfirmedItems(log.checklist_items);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-muted-foreground" />
                              {dayjs(log.check_timestamp).format('DD/MM/YYYY HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{log.guard_name_checked}</TableCell>
                          <TableCell>
                            {nonConfirmedCount > 0 ? (
                              <Badge variant="destructive">{nonConfirmedCount} Issue(s)</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">All OK</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.additional_comments ? (
                               <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{log.additional_comments}</span>
                               </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                                <UserCircle className="w-4 h-4 text-muted-foreground" />
                                {log.checker_user?.email || 'N/A'}
                             </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default UniformCheckLog;
