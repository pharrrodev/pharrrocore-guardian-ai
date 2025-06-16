
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Coffee } from 'lucide-react';
import { checkBreakStatus, logBreakQuery, type BreakCheckResponse } from '../api/break-check';
import { guards } from '../data/rota-data';

const BreakChecker = () => {
  const [selectedGuardId, setSelectedGuardId] = useState('');
  const [breakStatus, setBreakStatus] = useState<BreakCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckBreak = async () => {
    if (!selectedGuardId) return;
    
    setIsLoading(true);
    try {
      const result = checkBreakStatus(selectedGuardId);
      setBreakStatus(result);
      logBreakQuery(selectedGuardId, result.reply);
    } catch (error) {
      console.error('Error checking break status:', error);
      setBreakStatus({
        reply: 'Error checking break status. Please try again.',
        onBreak: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGuard = guards.find(guard => guard.id === selectedGuardId);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Break Time Checker</h1>
            <p className="text-muted-foreground">Check when your next break is scheduled</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Check Break Schedule</CardTitle>
              </div>
              <CardDescription>
                Select your guard ID to see your current break status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guardSelect">Select Guard</Label>
                <select
                  id="guardSelect"
                  value={selectedGuardId}
                  onChange={(e) => setSelectedGuardId(e.target.value)}
                  className="w-full p-2 border border-input bg-background rounded-md"
                >
                  <option value="">Choose a guard...</option>
                  {guards.map(guard => (
                    <option key={guard.id} value={guard.id}>
                      {guard.id} - {guard.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button 
                onClick={handleCheckBreak} 
                disabled={!selectedGuardId || isLoading}
                className="w-full"
              >
                {isLoading ? 'Checking...' : 'Check Break Status'}
              </Button>
            </CardContent>
          </Card>

          {breakStatus && (
            <Card className={breakStatus.onBreak ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Coffee className={`h-5 w-5 ${breakStatus.onBreak ? 'text-green-600' : 'text-primary'}`} />
                  <CardTitle className={breakStatus.onBreak ? 'text-green-700 dark:text-green-300' : ''}>
                    {breakStatus.onBreak ? 'On Break Now!' : 'Break Schedule'}
                  </CardTitle>
                </div>
                {selectedGuard && (
                  <CardDescription>
                    Status for {selectedGuard.name} ({selectedGuard.id})
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${breakStatus.onBreak ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                    <p className="font-medium">{breakStatus.reply}</p>
                  </div>
                  
                  {breakStatus.nextBreakTime && (
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Next Break:</strong> {breakStatus.nextBreakTime}</p>
                      <p><strong>Time Until:</strong> {breakStatus.timeUntilNext}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Current Break Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Checks if you're currently within any scheduled break time and shows how much time is left.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Next Break Calculation</h3>
                <p className="text-sm text-muted-foreground">
                  Shows your next scheduled break time and calculates how long until it starts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BreakChecker;
