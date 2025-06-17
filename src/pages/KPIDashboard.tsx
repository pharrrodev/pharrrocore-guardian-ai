import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker'; // Assuming you have a DatePicker
import { ArrowLeft, RefreshCw, BarChart3, Zap, ShieldCheck, Coffee, Users } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

interface DailyKpiMetric {
  id: string;
  report_date: string; // YYYY-MM-DD
  total_patrols: number;
  patrol_target_achieved_percentage: number;
  total_breaks_logged: number;
  uniform_compliance_percentage: number;
  guards_on_duty: number;
  patrols_per_guard_avg?: number | null;
  generated_at: string;
}

const KPIDashboard = () => {
  const [kpiData, setKpiData] = useState<DailyKpiMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(dayjs().subtract(7, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);


  const fetchKpiData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('daily_kpi_metrics')
        .select('*')
        .order('report_date', { ascending: false });

      if (startDate) {
        query = query.gte('report_date', dayjs(startDate).format('YYYY-MM-DD'));
      }
      if (endDate) {
        query = query.lte('report_date', dayjs(endDate).format('YYYY-MM-DD'));
      }

      const { data, error } = await query;
      if (error) throw error;
      setKpiData(data || []);
    } catch (err: any) {
      console.error("Error fetching KPI data:", err);
      toast.error(`Failed to load KPI data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData]);

  const handleGenerateKpis = async () => {
    setIsGenerating(true);
    toast.info("Requesting KPI generation for yesterday...");
    try {
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      const { error } = await supabase.functions.invoke('generate-daily-kpis', {
        body: { targetDate: yesterday } // Pass targetDate to the function
      });
      if (error) throw error;
      toast.success(`KPI generation for ${yesterday} initiated. Data will refresh shortly.`);
      // Optionally, trigger a delayed refresh or rely on real-time updates if implemented later
      setTimeout(fetchKpiData, 5000); // Give function some time to run
    } catch (error: any) {
      console.error('Error invoking KPI generation function:', error);
      toast.error(`KPI generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };


  const renderKpiCard = (title: string, value: string | number, icon: React.ReactNode, description?: string) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  // For displaying latest day's KPIs in cards - find the latest record
  const latestKpi = kpiData.length > 0 ? kpiData[0] : null;


  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" /><span className="sr-only">Back to Home</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">KPI Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Daily Key Performance Indicators for security operations.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateKpis} disabled={isGenerating} size="sm">
              <Zap className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate KPIs for Yesterday'}
            </Button>
             <Button onClick={fetchKpiData} disabled={isLoading || isGenerating} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading && !isGenerating ? 'animate-spin' : ''}`} />
                Refresh Data
            </Button>
          </div>
        </header>

        {/* Date Filters */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Filter by Date Range</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker id="start-date" value={startDate} onChange={setStartDate} />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker id="end-date" value={endDate} onChange={setEndDate} />
            </div>
             <Button onClick={fetchKpiData} className="self-end sm:self-center mt-4 sm:mt-0">Apply Filters</Button>
          </CardContent>
        </Card>

        {/* KPI Cards for Latest Data */}
        {latestKpi && !isLoading && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              Latest Metrics ({dayjs(latestKpi.report_date).format('DD MMM YYYY')})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderKpiCard("Total Patrols", latestKpi.total_patrols, <BarChart3 className="h-5 w-5 text-muted-foreground" />)}
              {renderKpiCard("Patrol Target", `${latestKpi.patrol_target_achieved_percentage}%`, <ShieldCheck className="h-5 w-5 text-muted-foreground" />, "Target Achieved %")}
              {renderKpiCard("Uniform Compliance", `${latestKpi.uniform_compliance_percentage}%`, <Users className="h-5 w-5 text-muted-foreground" />)}
              {renderKpiCard("Guards On Duty", latestKpi.guards_on_duty, <Users className="h-5 w-5 text-muted-foreground" />)}
              {renderKpiCard("Total Breaks Logged", latestKpi.total_breaks_logged, <Coffee className="h-5 w-5 text-muted-foreground" />)}
              {renderKpiCard("Avg Patrols/Guard", latestKpi.patrols_per_guard_avg?.toFixed(2) ?? 'N/A', <BarChart3 className="h-5 w-5 text-muted-foreground" />)}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historical KPI Data</CardTitle>
            <CardDescription>Daily performance metrics over the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center text-muted-foreground py-8">Loading KPI data...</p>}
            {!isLoading && kpiData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No KPI data found for the selected period.</p>
              </div>
            ) : !isLoading && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Date</TableHead>
                      <TableHead className="text-right">Patrols</TableHead>
                      <TableHead className="text-right">Patrol Target %</TableHead>
                      <TableHead className="text-right">Breaks Logged</TableHead>
                      <TableHead className="text-right">Uniform %</TableHead>
                      <TableHead className="text-right">Guards On Duty</TableHead>
                      <TableHead className="text-right">Avg Patrols/Guard</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpiData.map((kpi) => (
                      <TableRow key={kpi.id}>
                        <TableCell>{dayjs(kpi.report_date).format('DD MMM YYYY')}</TableCell>
                        <TableCell className="text-right">{kpi.total_patrols}</TableCell>
                        <TableCell className="text-right">{kpi.patrol_target_achieved_percentage.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{kpi.total_breaks_logged}</TableCell>
                        <TableCell className="text-right">{kpi.uniform_compliance_percentage.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{kpi.guards_on_duty}</TableCell>
                        <TableCell className="text-right">{kpi.patrols_per_guard_avg?.toFixed(2) ?? '-'}</TableCell>
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

export default KPIDashboard;
