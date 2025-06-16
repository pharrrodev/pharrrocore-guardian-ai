
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';
import { Radio, Handshake, ArrowLeft, Check } from 'lucide-react';
import { logRadioHandover } from '../api/radio-handover';
import { getTodaysLogs } from '../utils/appendCsv';
import { guards } from '../data/rota-data';
import dayjs from 'dayjs';

const RadioHandover = () => {
  const [selectedGuardId, setSelectedGuardId] = useState<string>('');
  const [todaysLogs, setTodaysLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedGuardId) {
      const logs = getTodaysLogs('logs/radioHandover.csv', selectedGuardId);
      setTodaysLogs(logs);
    }
  }, [selectedGuardId]);

  const handleAction = async (action: 'radio' | 'handover') => {
    if (!selectedGuardId) {
      toast.error('Please select a guard first');
      return;
    }

    setIsLoading(true);
    try {
      const response = logRadioHandover({
        guardId: selectedGuardId,
        action
      });

      if (response.status === 'ok') {
        toast.success(`${action === 'radio' ? 'Radio test' : 'Handover'} logged successfully`);
        // Refresh today's logs
        const updatedLogs = getTodaysLogs('logs/radioHandover.csv', selectedGuardId);
        setTodaysLogs(updatedLogs);
      } else {
        toast.error(response.message || 'Failed to log action');
      }
    } catch (error) {
      toast.error('Failed to log action');
    } finally {
      setIsLoading(false);
    }
  };

  const hasLoggedRadio = todaysLogs.some(log => log.action === 'radio');
  const hasLoggedHandover = todaysLogs.some(log => log.action === 'handover');
  
  const lastRadioLog = todaysLogs.filter(log => log.action === 'radio').pop();
  const lastHandoverLog = todaysLogs.filter(log => log.action === 'handover').pop();

  const selectedGuard = guards.find(g => g.id === selectedGuardId);

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
          {/* Guard Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Guard</CardTitle>
              <CardDescription>Choose your guard ID to log actions</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedGuardId} onValueChange={setSelectedGuardId}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {guards.map((guard) => (
                    <div key={guard.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={guard.id} id={guard.id} />
                      <label htmlFor={guard.id} className="text-sm font-medium cursor-pointer">
                        {guard.name} ({guard.id})
                      </label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {selectedGuardId && (
            <>
              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className={hasLoggedRadio ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
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
                            ? `Completed at ${dayjs(lastRadioLog?.timestamp).format('HH:mm')}` 
                            : 'Press to confirm radio is working'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleAction('radio')} 
                      disabled={isLoading}
                      className="w-full"
                      variant={hasLoggedRadio ? "secondary" : "default"}
                    >
                      {hasLoggedRadio ? 'Radio Test Complete' : 'Radio Test Passed'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className={hasLoggedHandover ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
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
                            ? `Completed at ${dayjs(lastHandoverLog?.timestamp).format('HH:mm')}` 
                            : 'Press to confirm handover complete'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleAction('handover')} 
                      disabled={isLoading}
                      className="w-full"
                      variant={hasLoggedHandover ? "secondary" : "default"}
                    >
                      {hasLoggedHandover ? 'Handover Complete' : 'Handover Complete'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Status - {selectedGuard?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className={`p-4 rounded-lg ${hasLoggedRadio ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <div className="text-2xl font-bold">
                        {hasLoggedRadio ? '✓' : '○'}
                      </div>
                      <div className="text-sm">Radio Test</div>
                    </div>
                    <div className={`p-4 rounded-lg ${hasLoggedHandover ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <div className="text-2xl font-bold">
                        {hasLoggedHandover ? '✓' : '○'}
                      </div>
                      <div className="text-sm">Handover</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* View Logs Link */}
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
