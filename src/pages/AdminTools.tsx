import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Play, CheckCircle, XCircle, Clock, Home, Loader2, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { generateKPIReport } from '@/scripts/kpiTracker';
import { generateDailySummary } from '@/scripts/dailySummary';
import { generateWeeklyClientReport } from '@/scripts/weeklyClientReport';
import { runLicenceChecker, getLicenceAlerts } from '@/scripts/licenceChecker';
import { runPayrollValidator, getLatestPayrollVarianceReport } from '@/scripts/payrollValidator';
import { checkNoShows, getAlertsLast24Hours } from '@/scripts/noShowCheck';
import dayjs from 'dayjs';

interface ScriptStatus {
  name: string;
  lastRun?: string;
  status: 'success' | 'error' | 'running' | 'never';
  message?: string;
  data?: any;
}

const AdminTools = () => {
  const initialStatuses = {
    'kpi': { name: 'KPI Tracker', status: 'never' as const },
    'daily-summary': { name: 'Daily Summary', status: 'never' as const },
    'weekly-report': { name: 'Weekly Client Report', status: 'never' as const },
    'licence-check': { name: 'Licence Checker', status: 'never' as const },
    'payroll-check': { name: 'Payroll Validator', status: 'never' as const },
    'no-show-check': { name: 'No-Show Checker', status: 'never' as const }
  };

  const [scriptStatuses, setScriptStatuses] = useState<Record<string, ScriptStatus>>(initialStatuses);
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadScriptStatuses();
  }, []);

  const loadScriptStatuses = () => {
    // Load statuses from localStorage
    const saved = localStorage.getItem('admin-script-statuses');
    if (saved) {
      try {
        setScriptStatuses(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (error) {
        console.error('Error loading script statuses:', error);
      }
    }
  };

  const saveScriptStatus = (scriptKey: string, status: Partial<ScriptStatus>) => {
    const updated = {
      ...scriptStatuses,
      [scriptKey]: { ...scriptStatuses[scriptKey], ...status }
    };
    setScriptStatuses(updated);
    localStorage.setItem('admin-script-statuses', JSON.stringify(updated));
  };

  const resetAdminState = () => {
    setScriptStatuses(initialStatuses);
    setRunningScripts(new Set());
    localStorage.removeItem('admin-script-statuses');
    toast({
      title: "Admin State Reset",
      description: "All script statuses have been cleared.",
    });
  };

  const runScript = async (scriptKey: string, endpoint: string) => {
    // Check admin authorization (hardcoded for demo)
    const userRole = localStorage.getItem('user-role') || 'user';
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin privileges required to run scripts.",
        variant: "destructive"
      });
      return;
    }

    setRunningScripts(prev => new Set(prev).add(scriptKey));
    saveScriptStatus(scriptKey, { status: 'running' });

    try {
      let result: any = {};
      let scriptData: any = null;

      // Execute the actual script functions instead of making API calls
      switch (scriptKey) {
        case 'kpi':
          result = await generateKPIReport();
          scriptData = result;
          break;
        case 'daily-summary':
          result = { content: await generateDailySummary() };
          scriptData = result;
          break;
        case 'weekly-report':
          result = { content: await generateWeeklyClientReport() };
          scriptData = result;
          break;
        case 'licence-check':
          runLicenceChecker();
          result = { alerts: getLicenceAlerts() };
          scriptData = result;
          break;
        case 'payroll-check':
          runPayrollValidator();
          result = { variances: getLatestPayrollVarianceReport() };
          scriptData = result;
          break;
        case 'no-show-check':
          result = { alerts: checkNoShows() };
          scriptData = result;
          break;
        default:
          throw new Error('Unknown script');
      }

      saveScriptStatus(scriptKey, {
        status: 'success',
        lastRun: new Date().toISOString(),
        message: 'Script completed successfully',
        data: scriptData
      });
      
      toast({
        title: "Script Completed",
        description: `${scriptStatuses[scriptKey].name} ran successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      saveScriptStatus(scriptKey, {
        status: 'error',
        lastRun: new Date().toISOString(),
        message: errorMessage
      });
      toast({
        title: "Script Failed",
        description: `${scriptStatuses[scriptKey].name}: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setRunningScripts(prev => {
        const updated = new Set(prev);
        updated.delete(scriptKey);
        return updated;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'running': return <Badge variant="secondary">Running</Badge>;
      default: return <Badge variant="outline">Never Run</Badge>;
    }
  };

  const formatLastRun = (lastRun?: string) => {
    if (!lastRun) return 'Never';
    const date = new Date(lastRun);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderScriptOutput = (scriptKey: string, script: ScriptStatus) => {
    if (!script.data || script.status !== 'success') return null;

    switch (scriptKey) {
      case 'kpi':
        return (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">KPI Metrics</h4>
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
                  <TableCell>{script.data.patrolComplianceRate}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Uniform Compliance</TableCell>
                  <TableCell>{script.data.uniformCompliance}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Patrols</TableCell>
                  <TableCell>{script.data.totalPatrols}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Breaks Taken</TableCell>
                  <TableCell>{script.data.breaksTaken}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );

      case 'daily-summary':
        return (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">Daily Summary Report</h4>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-48 whitespace-pre-wrap">
              {script.data.content}
            </pre>
          </div>
        );

      case 'weekly-report':
        return (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">Weekly Client Report</h4>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              <span>Report generated successfully</span>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md text-xs">
              <strong>Preview:</strong>
              <br />
              {script.data.content.split('\n').slice(0, 5).join('\n')}...
            </div>
          </div>
        );

      case 'licence-check':
        return (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">Licence Alerts ({script.data.alerts.length})</h4>
            {script.data.alerts.length > 0 ? (
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
                  {script.data.alerts.map((alert: any, index: number) => (
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
            ) : (
              <p className="text-sm text-muted-foreground">No licence alerts - all licences valid for next 60 days</p>
            )}
          </div>
        );

      case 'payroll-check':
        return (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">Payroll Variances ({script.data.variances.length})</h4>
            {script.data.variances.length > 0 ? (
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
                  {script.data.variances.map((variance: any, index: number) => (
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
            ) : (
              <p className="text-sm text-muted-foreground">No significant payroll variances found</p>
            )}
          </div>
        );

      case 'no-show-check':
        return (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium">No-Show Alerts ({script.data.alerts.length})</h4>
            {script.data.alerts.length > 0 ? (
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
                  {script.data.alerts.map((alert: any, index: number) => (
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
            ) : (
              <p className="text-sm text-muted-foreground">No no-show alerts - all guards checked in on time</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Check if user is admin
  const userRole = localStorage.getItem('user-role') || 'user';
  const isAdmin = userRole === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Tools</h1>
              <p className="text-muted-foreground mt-2">Access Denied</p>
            </div>
            <Button asChild variant="outline" onClick={resetAdminState}>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Administrator Access Required</h2>
                <p className="text-muted-foreground">
                  You need admin privileges to access the Admin Tools dashboard.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    localStorage.setItem('user-role', 'admin');
                    window.location.reload();
                  }}
                >
                  Grant Admin Access (Demo)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Tools</h1>
            </div>
            <p className="text-muted-foreground">
              Manually trigger and monitor background security scripts
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" onClick={resetAdminState}>
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
          {Object.entries(scriptStatuses).map(([key, script]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(script.status)}
                    {script.name}
                  </span>
                  {getStatusBadge(script.status)}
                </CardTitle>
                <CardDescription>
                  Last run: {formatLastRun(script.lastRun)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {script.message && (
                  <div className="text-sm">
                    <span className="font-medium">Status: </span>
                    <span className={script.status === 'error' ? 'text-red-600' : 'text-green-600'}>
                      {script.message}
                    </span>
                  </div>
                )}
                
                <Button
                  onClick={() => {
                    const endpoints = {
                      'kpi': 'run-kpi',
                      'daily-summary': 'run-daily-summary',
                      'weekly-report': 'run-weekly-report',
                      'licence-check': 'run-licence-check',
                      'payroll-check': 'run-payroll-check',
                      'no-show-check': 'run-no-show-check'
                    };
                    runScript(key, endpoints[key as keyof typeof endpoints]);
                  }}
                  disabled={runningScripts.has(key)}
                  className="w-full"
                >
                  {runningScripts.has(key) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run {script.name}
                    </>
                  )}
                </Button>

                {renderScriptOutput(key, script)}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Script Information</CardTitle>
            <CardDescription>
              Background scripts and their purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Daily Operations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• KPI Tracker - Collects daily performance metrics</li>
                  <li>• Daily Summary - Generates comprehensive daily reports</li>
                  <li>• No-Show Checker - Monitors guard attendance</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Weekly & Compliance</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Weekly Report - Client-facing weekly summaries</li>
                  <li>• Licence Checker - SIA licence expiry monitoring</li>
                  <li>• Payroll Validator - Hours worked vs. paid verification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTools;
