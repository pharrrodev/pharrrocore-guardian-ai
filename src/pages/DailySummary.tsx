
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, FileText, Download, RefreshCw } from 'lucide-react';
import { generateDailySummary, getSavedReport, getAllSavedReports } from '@/scripts/dailySummary';
import { toast } from 'sonner';
import dayjs from 'dayjs';

const DailySummary = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [summaryContent, setSummaryContent] = useState('');
  const [savedReports, setSavedReports] = useState<{ date: string; path: string }[]>([]);

  useEffect(() => {
    loadSavedReports();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadSummaryForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadSavedReports = () => {
    const reports = getAllSavedReports();
    setSavedReports(reports);
  };

  const loadSummaryForDate = (date: string) => {
    const report = getSavedReport(date);
    setSummaryContent(report || '');
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateDailySummary();
      setSummaryContent(summary);
      loadSavedReports(); // Refresh the list
      toast.success('Daily summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate daily summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!summaryContent) {
      toast.error('No summary content to download');
      return;
    }

    const blob = new Blob([summaryContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-summary-${selectedDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Security Summary</h1>
            <p className="text-muted-foreground mt-2">
              Generate and view comprehensive daily security reports
            </p>
          </div>
          <Button onClick={() => window.history.back()} variant="outline">
            ← Back
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Generate New Summary
              </CardTitle>
              <CardDescription>
                Create a comprehensive daily security summary for today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Today's date: <span className="font-medium">{dayjs().format('dddd, MMMM D, YYYY')}</span></p>
                <p className="mt-1">This will compile all activities from:</p>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                  <li>Electronic Daily Occurrence Book entries</li>
                  <li>Security incident reports</li>
                  <li>Visitor logs</li>
                  <li>Shift activities</li>
                  <li>No-show alerts</li>
                </ul>
              </div>
              <Button 
                onClick={handleGenerateSummary} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Today's Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                View Saved Reports
              </CardTitle>
              <CardDescription>
                Access previously generated daily summaries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={dayjs().format('YYYY-MM-DD')}>
                    Today ({dayjs().format('MMM D, YYYY')})
                  </SelectItem>
                  {savedReports.map((report) => (
                    <SelectItem key={report.date} value={report.date}>
                      {dayjs(report.date).format('MMM D, YYYY')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {savedReports.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No saved reports found. Generate your first summary above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security Summary Report</CardTitle>
                <CardDescription>
                  {selectedDate ? `Report for ${dayjs(selectedDate).format('dddd, MMMM D, YYYY')}` : 'Select a date to view report'}
                </CardDescription>
              </div>
              {summaryContent && (
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {summaryContent ? (
              <Textarea
                value={summaryContent}
                readOnly
                className="min-h-[400px] font-mono text-sm"
                placeholder="Summary content will appear here..."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No summary available for selected date</p>
                <p className="text-sm mt-1">Generate a new summary or select a different date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailySummary;
