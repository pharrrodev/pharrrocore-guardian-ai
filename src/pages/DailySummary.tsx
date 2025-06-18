import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, FileText, RefreshCw, Home } from 'lucide-react';
import { loadTodaysData, generateFallbackSummary, saveSummaryReport, getSavedReport, getAllSavedReports, DailySummaryData } from '@/scripts/dailySummary';
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client for auth
import { toast } from 'sonner';
import dayjs from 'dayjs';
import SummaryReportModal from '@/components/SummaryReportModal';
import { Link } from 'react-router-dom';

const DailySummary = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [summaryContent, setSummaryContent] = useState('');
  // Update savedReports state type to match what getAllSavedReports returns
  const [savedReports, setSavedReports] = useState<{ summary_date: string; id: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false); // For loading summary content

  const loadSavedReports = async () => {
    const reports = await getAllSavedReports(); // Now async
    setSavedReports(reports);
  };

  const loadSummaryForDate = async (date: string) => {
    if (!date) return;
    setIsLoadingSummary(true);
    setSummaryContent(''); // Clear previous summary while loading
    const reportContent = await getSavedReport(date); // Now async
    setSummaryContent(reportContent || '');
    setIsLoadingSummary(false);
  };

  // Initial load of saved reports and summary for the default selected date
  useEffect(() => {
    loadSavedReports();
  }, []); // Load all report dates once on mount

  useEffect(() => {
    // When selectedDate changes, load its summary content
    loadSummaryForDate(selectedDate);
  }, [selectedDate]);


  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setSummaryContent(''); // Clear previous summary
    const today = dayjs().format('YYYY-MM-DD');
    const todayDisplay = dayjs().format('dddd, MMMM D, YYYY');

    try {
      const summaryData: DailySummaryData = await loadTodaysData(today);
      let finalSummary: string;

      // Try to get summary from API
      try {
        const response = await fetch('/api/daily-summary-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ summaryData, todayDisplay }),
        });

        if (!response.ok) {
          const errorResult = await response.json().catch(() => null);
          // If API indicates key is missing, or another specific error, fall back.
          // For now, any non-ok response triggers fallback.
          console.warn(`API error: ${response.status}, falling back. Details:`, errorResult?.error || 'No details');
          throw new Error(errorResult?.error || `API Error: ${response.status}`);
        }

        const result = await response.json();
        finalSummary = result.summary;
        toast.success('Daily summary generated successfully via AI!');

      } catch (apiError) {
        console.warn('API call failed, using fallback summary:', apiError instanceof Error ? apiError.message : apiError);
        toast.info('Using fallback summary as AI generation failed or is unavailable.');
        finalSummary = generateFallbackSummary(summaryData, todayDisplay);
      }

      setSummaryContent(finalSummary);

      // Get current user ID for saving the summary
      const { data: { user } } = await supabase.auth.getUser();
      await saveSummaryReport(today, finalSummary, user?.id || null, summaryData);

      await loadSavedReports(); // Refresh the list of saved reports (now async)
      setSelectedDate(today); // Ensure the current date is selected to view the new report
      setShowModal(true); // Show the modal with the generated summary

    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Failed to generate daily summary: ${errorMessage}`);
      // Optionally, generate a fallback here too if loadTodaysData itself fails
      // For now, just showing the error.
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewReport = () => {
    if (summaryContent) {
      setShowModal(true);
    } else {
      toast.error('No summary available for selected date');
    }
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
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button onClick={() => window.history.back()} variant="outline">
              ← Back
            </Button>
          </div>
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
                  {/* Update map key and value according to new savedReports structure */}
                  {savedReports.map((report) => (
                    <SelectItem key={report.id} value={report.summary_date}>
                      {dayjs(report.summary_date).format('MMM D, YYYY')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isLoadingSummary ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Loading summary...</p>
                </div>
              ) : summaryContent ? (
                <Button onClick={handleViewReport} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  View Report
                </Button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No summary available for {dayjs(selectedDate).format('MMM D, YYYY')}.
                  </p>
                  {selectedDate === dayjs().format('YYYY-MM-DD') && (
                     <p className="text-xs text-muted-foreground mt-1">
                       Generate today's summary using the panel on the left.
                     </p>
                  )}
                </div>
              )}
              
              {savedReports.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No saved reports found. Generate your first summary above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <SummaryReportModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          summaryContent={summaryContent}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default DailySummary;
