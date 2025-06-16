
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { runPayrollValidator, getLatestPayrollVarianceReport } from '@/scripts/payrollValidator';

interface VarianceRecord {
  guardId: string;
  date: string;
  actualHours: number;
  hoursPaid: number;
  variance: number;
  siteCode: string;
}

const PayrollVariance = () => {
  const [variances, setVariances] = useState<VarianceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadVarianceData();
  }, []);

  const loadVarianceData = () => {
    const data = getLatestPayrollVarianceReport();
    setVariances(data);
    setLastUpdated(new Date().toLocaleString());
  };

  const handleRunValidator = async () => {
    setIsLoading(true);
    try {
      runPayrollValidator();
      // Reload data after running validator
      setTimeout(() => {
        loadVarianceData();
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error running payroll validator:', error);
      setIsLoading(false);
    }
  };

  const getVarianceBadge = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance > 1) {
      return <Badge variant="destructive">High Variance</Badge>;
    } else if (absVariance > 0.5) {
      return <Badge variant="secondary">Medium Variance</Badge>;
    } else {
      return <Badge variant="outline">Low Variance</Badge>;
    }
  };

  const getRowClassName = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance > 0.25) {
      return "bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payroll Variance Report</h1>
            <p className="text-muted-foreground mt-2">
              Compare actual worked hours vs paid hours to identify discrepancies
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={loadVarianceData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleRunValidator}
              disabled={isLoading}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isLoading ? 'Running...' : 'Run Validator'}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Variances</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{variances.length}</div>
              <p className="text-xs text-muted-foreground">
                Records with variance {'>'}  0.25h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Variance</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {variances.length > 0 
                  ? (variances.reduce((sum, v) => sum + Math.abs(v.variance), 0) / variances.length).toFixed(2)
                  : '0.00'
                }h
              </div>
              <p className="text-xs text-muted-foreground">
                Average absolute variance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{lastUpdated || 'Never'}</div>
              <p className="text-xs text-muted-foreground">
                Report generation time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Variance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Variances</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing all records where |variance| {'>'} 0.25 hours
            </p>
          </CardHeader>
          <CardContent>
            {variances.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Variances Found</h3>
                <p className="text-muted-foreground mb-4">
                  Either no payroll data is available or all hours match perfectly.
                </p>
                <Button onClick={handleRunValidator} disabled={isLoading}>
                  <FileText className="h-4 w-4 mr-2" />
                  {isLoading ? 'Running...' : 'Generate Report'}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">Paid Hours</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variances.map((variance, index) => (
                      <TableRow 
                        key={index}
                        className={getRowClassName(variance.variance)}
                      >
                        <TableCell className="font-medium">{variance.guardId}</TableCell>
                        <TableCell>{variance.date}</TableCell>
                        <TableCell>{variance.siteCode}</TableCell>
                        <TableCell className="text-right">{variance.actualHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{variance.hoursPaid.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          variance.variance > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {variance.variance > 0 ? '+' : ''}{variance.variance.toFixed(2)}h
                        </TableCell>
                        <TableCell>{getVarianceBadge(variance.variance)}</TableCell>
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

export default PayrollVariance;
