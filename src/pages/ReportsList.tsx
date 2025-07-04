
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
// Removed: import { getWeeklyReports } from '@/scripts/weeklyClientReport';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase
import dayjs from 'dayjs';

// Interface matches generated_reports_metadata table
interface ReportMetadata {
  id: string;
  report_name: string;
  report_type: string; // e.g., "WeeklyClientMarkdown", "WeeklyClientPDF"
  generation_date: string; // TIMESTAMPTZ
  period_start_date: string; // DATE
  period_end_date: string; // DATE
  file_storage_path: string;
  file_size_bytes?: number | null;
  generated_by_user_id?: string | null;
  site_id?: string | null;
}

const ReportsList = () => {
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true); // isLoading instead of loading
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // To track which report is downloading

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_reports_metadata')
        .select('*')
        .order('generation_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
      if (data && data.length > 0) {
        toast.success(`Found ${data.length} reports.`);
      } else {
        toast.info("No reports found.");
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to load reports: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const reportsChannel = supabase
      .channel('generated-reports-metadata-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'generated_reports_metadata' },
        (payload) => {
          console.log('New report metadata received!', payload);
          toast.info('A new report has been generated. Refreshing list...');
          fetchReports(); // Re-fetch reports when a new one is inserted
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
    };
  }, []);

  const handleDownload = async (report: ReportMetadata) => {
    if (!report.file_storage_path) {
      toast.error("File path is missing for this report.");
      return;
    }
    setIsDownloading(report.id);
    try {
      // Generate a signed URL for secure download (recommended for private buckets)
      // Expires in 1 hour (3600 seconds)
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('client-reports') // Ensure this is your bucket name
        .createSignedUrl(report.file_storage_path, 3600);

      if (signedUrlError) throw signedUrlError;

      const link = document.createElement('a');
      link.href = signedUrlData.signedUrl;
      // Extract filename from path or use report_name
      link.download = report.report_name || report.file_storage_path.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${report.report_name}...`);

    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Failed to download report: ${errorMessage}`);
    } finally {
      setIsDownloading(null);
    }
  };

  const getReportTypeDisplay = (reportType: string): string => {
    if (reportType.toLowerCase().includes('pdf')) return 'PDF Document';
    if (reportType.toLowerCase().includes('markdown')) return 'Markdown Document';
    return reportType || 'Unknown';
  };

  const getFileSizeDisplay = (sizeInBytes?: number | null): string => {
    if (sizeInBytes == null) return 'N/A';
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Client Reports</h1>
              <p className="text-slate-300">Weekly security reports and compliance documentation</p>
            </div>
            <Button onClick={fetchReports} disabled={isLoading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Weekly Client Reports
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Professional security reports generated weekly for client review
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                {reports.length} Report{reports.length === 1 ? '' : 's'} Available
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-12 text-slate-300">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
                Loading reports...
              </div>
            )}
            {!isLoading && reports.length > 0 ? (
              <div className="rounded-lg border border-white/20 bg-white/5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-slate-300">Report Name</TableHead>
                      <TableHead className="text-slate-300">Period</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Size</TableHead>
                      <TableHead className="text-slate-300">Generated At</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} className="border-white/20 hover:bg-white/5">
                        <TableCell className="text-white font-medium">
                           {report.report_name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            {dayjs(report.period_start_date).format('DD MMM')} - {dayjs(report.period_end_date).format('DD MMM YYYY')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={report.report_type.toLowerCase().includes('pdf') ? 'default' : 'secondary'}
                            className={report.report_type.toLowerCase().includes('pdf') ? "bg-green-500/20 text-green-200" : "bg-sky-500/20 text-sky-200"}
                          >
                            {getReportTypeDisplay(report.report_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {getFileSizeDisplay(report.file_size_bytes)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {dayjs(report.generation_date).format('DD MMM YYYY HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDownload(report)}
                            size="sm"
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                            disabled={isDownloading === report.id}
                          >
                            {isDownloading === report.id ?
                              <RefreshCw className="w-4 h-4 animate-spin" /> :
                              <Download className="w-4 h-4" />
                            }
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : !isLoading && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No Reports Available</h3>
                <p className="text-slate-400 mb-4">
                  Weekly client reports will appear here once they are generated by the automated system.
                </p>
                <p className="text-sm text-slate-500">
                  Reports are automatically generated every Monday at 08:00 for the previous week.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Report Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">
                New reports are generated every Monday at 08:00, covering the previous week's security operations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Report Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">
                Each report includes KPI metrics, incident summaries, patrol logs, and compliance assessments.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Client Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">
                Professional PDF format suitable for client presentations and compliance documentation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsList;
