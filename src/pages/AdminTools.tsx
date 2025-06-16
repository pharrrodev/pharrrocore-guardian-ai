import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Play, CheckCircle, XCircle, Clock, Home, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { generateKPIReport } from '@/scripts/kpiTracker';
import { generateDailySummary } from '@/scripts/dailySummary';
import { generateWeeklyClientReport } from '@/scripts/weeklyClientReport';
import { runLicenceChecker, getLicenceAlerts } from '@/scripts/licenceChecker';
import { runPayrollValidator, getLatestPayrollVarianceReport } from '@/scripts/payrollValidator';
import { checkNoShows, getAlertsLast24Hours } from '@/scripts/noShowCheck';
import ScriptReportModal from '@/components/ScriptReportModal';

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
  const [selectedScript, setSelectedScript] = useState<{ key: string; script: ScriptStatus } | null>(null);
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

  const handleViewReport = (scriptKey: string) => {
    const script = scriptStatuses[scriptKey];
    if (script.status === 'success' && script.data) {
      setSelectedScript({ key: scriptKey, script });
    }
  };

  // Check if user is admin
  const userRole = localStorage.getItem('user-role') || 'user';
  const isAdmin = userRole === 'admin';

  if (!isAdmin) {
    return (
      <div className="h-screen bg-background p-4 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Tools</h1>
              <p className="text-muted-foreground mt-2">Access Denied</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
          
          <Card className="flex-1 flex flex-col">
            <CardContent className="pt-6 flex-1 flex items-center justify-center">
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
    <div className="h-screen bg-background p-4 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1 overflow-auto">
          {Object.entries(scriptStatuses).map(([key, script]) => (
            <Card key={key} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(script.status)}
                    {script.name}
                  </span>
                  {getStatusBadge(script.status)}
                </CardTitle>
                <CardDescription className="text-sm">
                  Last run: {formatLastRun(script.lastRun)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {script.message && (
                  <div className="text-sm">
                    <span className="font-medium">Status: </span>
                    <span className={script.status === 'error' ? 'text-red-600' : 'text-green-600'}>
                      {script.message}
                    </span>
                  </div>
                )}
                
                <div className="flex gap-2">
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
                    className="flex-1"
                    size="sm"
                  >
                    {runningScripts.has(key) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run
                      </>
                    )}
                  </Button>
                  
                  {script.status === 'success' && script.data && (
                    <Button
                      variant="outline"
                      onClick={() => handleViewReport(key)}
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-4" />

        <Card className="mt-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Script Information</CardTitle>
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

      {selectedScript && (
        <ScriptReportModal
          isOpen={!!selectedScript}
          onClose={() => setSelectedScript(null)}
          scriptKey={selectedScript.key}
          scriptName={selectedScript.script.name}
          scriptData={selectedScript.script.data}
        />
      )}
    </div>
  );
};

export default AdminTools;
