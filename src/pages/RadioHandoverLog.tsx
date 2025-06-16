
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Radio, Handshake } from 'lucide-react';
import { getLogsFromStorage, RadioHandoverLogEntry } from '../utils/appendCsv';
import { rotaData } from '../data/rota-data';
import dayjs from 'dayjs';

const RadioHandoverLog = () => {
  const [logs, setLogs] = useState<RadioHandoverLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<RadioHandoverLogEntry[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    const allLogs = getLogsFromStorage('logs/radioHandover.csv');
    setLogs(allLogs);
    setFilteredLogs(allLogs);
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (dateFilter) {
      filtered = filtered.filter(log => 
        dayjs(log.timestamp).format('YYYY-MM-DD') === dateFilter
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => dayjs(b.timestamp).unix() - dayjs(a.timestamp).unix());

    setFilteredLogs(filtered);
  }, [logs, dateFilter, actionFilter]);

  const getShiftStartTime = (guardId: string, date: string): string | null => {
    const shift = rotaData.find(s => s.guardId === guardId && s.date === date);
    return shift ? shift.startTime : null;
  };

  const isRadioTestLate = (log: RadioHandoverLogEntry): boolean => {
    if (log.action !== 'radio') return false;
    
    const logDate = dayjs(log.timestamp).format('YYYY-MM-DD');
    const shiftStartTime = getShiftStartTime(log.guardId, logDate);
    
    if (!shiftStartTime) return false;
    
    const shiftStart = dayjs(`${logDate} ${shiftStartTime}`);
    const logTime = dayjs(log.timestamp);
    const timeDiff = logTime.diff(shiftStart, 'minute');
    
    return timeDiff > 5; // More than 5 minutes after shift start
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/radio-handover">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Radio & Handover Logs</h1>
            <p className="text-muted-foreground">View all radio test and handover completion logs</p>
          </div>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateFilter" className="block text-sm font-medium mb-2">
                  Filter by Date
                </label>
                <Input
                  id="dateFilter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="actionFilter" className="block text-sm font-medium mb-2">
                  Filter by Action
                </label>
                <select
                  id="actionFilter"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="all">All Actions</option>
                  <option value="radio">Radio Tests</option>
                  <option value="handover">Handovers</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Entries ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No log entries found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Guard</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className={isRadioTestLate(log) ? 'bg-red-50 dark:bg-red-950' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {dayjs(log.timestamp).format('MMM DD, YYYY')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {dayjs(log.timestamp).format('HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.guardName}</div>
                          <div className="text-sm text-muted-foreground">{log.guardId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.action === 'radio' ? (
                            <Radio className="h-4 w-4" />
                          ) : (
                            <Handshake className="h-4 w-4" />
                          )}
                          <span className="capitalize">{log.action === 'radio' ? 'Radio Test' : 'Handover'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isRadioTestLate(log) ? (
                          <span className="text-red-600 font-medium">Late (>5min after shift)</span>
                        ) : (
                          <span className="text-green-600 font-medium">On Time</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RadioHandoverLog;
