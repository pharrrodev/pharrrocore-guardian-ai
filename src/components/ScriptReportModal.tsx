
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Home } from "lucide-react";
import { Link } from "react-router-dom";
import dayjs from 'dayjs';

// Individual script data types
interface KpiReportData {
  patrolComplianceRate: number;
  uniformCompliance: number;
  totalPatrols: number;
  breaksTaken: number;
}

interface DailySummaryReportData {
  content: string;
}

interface WeeklyReportData {
  content: string;
}

interface LicenceAlert {
  guardName: string;
  expiresDate: string | Date;
  daysLeft: number;
}

interface LicenceCheckReportData {
  alerts: LicenceAlert[];
}

interface PayrollVariance {
  guardId: string;
  date: string;
  actualHours: number;
  hoursPaid: number;
  variance: number;
}

interface PayrollCheckReportData {
  variances: PayrollVariance[];
}

interface NoShowReportAlert {
  guardName: string;
  date: string;
  shiftStartTime: string;
}

interface NoShowCheckReportData {
  alerts: NoShowReportAlert[];
}

// Union type for all possible script data structures
type AllScriptData =
  | KpiReportData
  | DailySummaryReportData
  | WeeklyReportData
  | LicenceCheckReportData
  | PayrollCheckReportData
  | NoShowCheckReportData;

interface ScriptReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptKey: 'kpi' | 'daily-summary' | 'weekly-report' | 'licence-check' | 'payroll-check' | 'no-show-check';
  scriptName: string;
  scriptData: AllScriptData;
}

const ScriptReportModal: React.FC<ScriptReportModalProps> = ({
  isOpen,
  onClose,
  scriptKey,
  scriptName,
  scriptData
}) => {
  const renderScriptContent = () => {
    if (!scriptData) return null;

    switch (scriptKey) {
      case 'kpi':
        const kpiData = scriptData as KpiReportData;
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">KPI Metrics</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Patrol Compliance</TableCell>
                  <TableCell>{kpiData.patrolComplianceRate}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Uniform Compliance</TableCell>
                  <TableCell>{kpiData.uniformCompliance}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Patrols</TableCell>
                  <TableCell>{kpiData.totalPatrols}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Breaks Taken</TableCell>
                  <TableCell>{kpiData.breaksTaken}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );

      case 'daily-summary':
        const dailyData = scriptData as DailySummaryReportData;
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Daily Summary Report</h4>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {dailyData.content}
              </pre>
            </div>
          </div>
        );

      case 'weekly-report':
        const weeklyData = scriptData as WeeklyReportData;
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Weekly Client Report</h4>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              <span>Report generated successfully</span>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-auto">
              <strong>Preview:</strong>
              <br />
              <pre className="text-sm whitespace-pre-wrap mt-2">
                {weeklyData.content.split('\n').slice(0, 20).join('\n')}...
              </pre>
            </div>
          </div>
        );

      case 'licence-check':
        const licenceData = scriptData as LicenceCheckReportData;
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Licence Alerts ({licenceData.alerts.length})</h4>
            {licenceData.alerts.length > 0 ? (
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenceData.alerts.map((alert: LicenceAlert, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{alert.guardName}</TableCell>
                        <TableCell>{dayjs(alert.expiresDate).format('YYYY-MM-DD')}</TableCell>
                        <TableCell>{alert.daysLeft}</TableCell>
                        <TableCell>
                          <Badge variant={alert.daysLeft < 0 ? "destructive" : alert.daysLeft < 30 ? "secondary" : "default"}>
                            {alert.daysLeft < 0 ? "Expired" : alert.daysLeft < 30 ? "Expiring Soon" : "OK"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No licence alerts - all licences valid for next 60 days</p>
            )}
          </div>
        );

      case 'payroll-check':
        const payrollData = scriptData as PayrollCheckReportData;
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Payroll Variances ({payrollData.variances.length})</h4>
            {payrollData.variances.length > 0 ? (
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actual Hours</TableHead>
                      <TableHead>Paid Hours</TableHead>
                      <TableHead>Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.variances.map((variance: PayrollVariance, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{variance.guardId}</TableCell>
                        <TableCell>{variance.date}</TableCell>
                        <TableCell>{variance.actualHours}</TableCell>
                        <TableCell>{variance.hoursPaid}</TableCell>
                        <TableCell>
                          <span className={variance.variance > 0 ? "text-green-600" : "text-red-600"}>
                            {variance.variance > 0 ? '+' : ''}{variance.variance} hrs
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No significant payroll variances found</p>
            )}
          </div>
        );

      case 'no-show-check':
        const noShowData = scriptData as NoShowCheckReportData;
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">No-Show Alerts ({noShowData.alerts.length})</h4>
            {noShowData.alerts.length > 0 ? (
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guard</TableHead>
                      <TableHead>Shift Date</TableHead>
                      <TableHead>Expected Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {noShowData.alerts.map((alert: NoShowReportAlert, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{alert.guardName}</TableCell>
                        <TableCell>{alert.date}</TableCell>
                        <TableCell>{alert.shiftStartTime}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Not Signed In</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No no-show alerts - all guards checked in on time</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{scriptName} Report</DialogTitle>
          <DialogDescription>
            Generated results and data analysis
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {renderScriptContent()}
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button onClick={onClose}>
            Back to Admin Tools
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptReportModal;
export type { AllScriptData };
