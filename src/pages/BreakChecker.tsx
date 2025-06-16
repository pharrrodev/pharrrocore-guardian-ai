
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Coffee, Home, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { checkBreakStatus } from '@/api/break-check';

const BreakChecker = () => {
  const [guardName, setGuardName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentTime, setCurrentTime] = useState('');
  const [breakStatus, setBreakStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkBreak = async () => {
    if (!guardName || !selectedDate || !currentTime) {
      return;
    }

    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const result = await checkBreakStatus({
        guardName: guardName.trim(),
        date: dateStr,
        currentTime
      });
      setBreakStatus(result);
    } catch (error) {
      console.error('Error checking break status:', error);
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
              <Label htmlFor="guardName">Guard Name</Label>
              <Input
                id="guardName"
                value={guardName}
                onChange={(e) => setGuardName(e.target.value)}
                placeholder="Enter your name"
              />
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
