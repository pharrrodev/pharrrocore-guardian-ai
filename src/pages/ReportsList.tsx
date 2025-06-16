
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getWeeklyReports } from '@/scripts/weeklyClientReport';
import dayjs from 'dayjs';

interface WeeklyReport {
  filename: string;
  path: string;
  date: string;
}

const ReportsList = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = () => {
    setLoading(true);
    try {
      const availableReports = getWeeklyReports();
      setReports(availableReports);
      toast.success(`Found ${availableReports.length} weekly reports`);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownload = (report: WeeklyReport) => {
    try {
      const content = localStorage.getItem(report.path);
      if (!content) {
        toast.error('Report content not found');
        return;
      }

      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${report.filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };

  const getReportType = (filename: string): string => {
    if (filename.includes('.pdf')) return 'PDF';
    if (filename.includes('.md')) return 'Markdown';
    return 'Unknown';
  };

  const getFileSize = (path: string): string => {
    try {
      const content = localStorage.getItem(path);
      if (!content) return 'Unknown';
      const sizeInBytes = new Blob([content]).size;
      if (sizeInBytes < 1024) return `${sizeInBytes} B`;
      if (sizeInBytes < 1024 * 1024) return `${Math.round(sizeInBytes / 1024)} KB`;
      return `${Math.round(sizeInBytes / (1024 * 1024))} MB`;
    } catch {
      return 'Unknown';
    }
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
            <Button onClick={loadReports} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                {reports.length} Reports Available
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="rounded-lg border border-white/20 bg-white/5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-slate-300">Report Period</TableHead>
                      <TableHead className="text-slate-300">Filename</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Size</TableHead>
                      <TableHead className="text-slate-300">Generated</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
                      <TableRow key={index} className="border-white/20 hover:bg-white/5">
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            {report.date}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300 font-mono text-sm">
                          {report.filename}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getReportType(report.filename) === 'PDF' ? 'default' : 'secondary'}
                            className="bg-green-500/20 text-green-200"
                          >
                            {getReportType(report.filename)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {getFileSize(report.path)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {dayjs().format('MMM DD, YYYY')}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDownload(report)}
                            size="sm"
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
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
