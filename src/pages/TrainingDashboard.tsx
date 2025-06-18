
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import AddTraining from './AddTraining'; // This is the modal component
import { supabase } from '@/lib/supabaseClient'; // Import Supabase
import { toast } from 'sonner'; // For notifications
import { RefreshCw } from 'lucide-react'; // For loading icon

// Interface for records fetched from Supabase (matches 'training_records' table)
interface SupabaseTrainingRecord {
  id: string;
  guard_user_id: string | null;
  guard_name_recorded: string;
  course_name: string;
  completed_date: string; // YYYY-MM-DD
  expiry_date: string;    // YYYY-MM-DD
  certificate_url: string | null;
  added_by_user_id: string;
  created_at: string;
  // Optional: joined data for added_by_user_id if needed
  // added_by_user: { email?: string; user_metadata?: { full_name?: string } } | null;
}

const TrainingDashboard = () => {
  const [records, setRecords] = useState<SupabaseTrainingRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Renamed from loading to isLoading

  const fetchTrainingRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('training_records')
        .select(`
          *,
          added_by_user:added_by_user_id (email, user_metadata->>full_name)
        `) // Example of joining to get adder's info
        .order('expiry_date', { ascending: true });

      if (error) {
        console.error("Error fetching training records:", error);
        toast.error(`Failed to load records: ${error.message}`);
        setRecords([]);
      } else {
        setRecords(data || []);
      }
    } catch (e: any) {
      console.error("Unexpected error fetching records:", e);
      toast.error(`An unexpected error occurred: ${e.message}`);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingRecords();

    // Set up real-time subscription
    const channel = supabase
      .channel('training-records-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_records' },
        (payload) => {
          console.log('Training records change received!', payload);
          toast.info('Training records have been updated. Refreshing list...');
          fetchTrainingRecords(); // Re-fetch data on any change
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Run once on mount

  const getRowClass = (expiryDate: string) => { // Parameter changed to expiryDate
    const daysUntilExpiry = dayjs(expiryDate).diff(dayjs(), 'days');
    
    if (daysUntilExpiry < 0) return 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500';
    if (daysUntilExpiry < 7) return 'bg-red-50 dark:bg-red-800/30 border-l-4 border-red-400';
    if (daysUntilExpiry < 30) return 'bg-yellow-50 dark:bg-yellow-800/30 border-l-4 border-yellow-400';
    return 'border-l-4 border-transparent'; // Default or for valid records
  };

  const getExpiryBadge = (expiryDate: string) => { // Parameter changed to expiryDate
    const daysUntilExpiry = dayjs(expiryDate).diff(dayjs(), 'days');
    
    if (daysUntilExpiry < 0) return <Badge variant="destructive">Expired {Math.abs(daysUntilExpiry)} days ago</Badge>;
    if (daysUntilExpiry < 7) return <Badge variant="destructive" className="bg-red-500">Expires in {daysUntilExpiry}d</Badge>;
    if (daysUntilExpiry < 30) return <Badge variant="secondary" className="bg-yellow-500 text-yellow-950">Expires in {daysUntilExpiry}d</Badge>;
    return <Badge variant="outline">Expires in {daysUntilExpiry}d</Badge>;
  };

  const handleRecordAdded = () => {
    // fetchTrainingRecords(); // Data will be re-fetched by real-time subscription
    setIsAddModalOpen(false); // Just close modal, RT will update list
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading training records...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
            <p className="text-muted-foreground">
              Track training records and certifications
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Record
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {records.filter(r => {
                const days = dayjs(r.expiry_date).diff(dayjs(), 'days'); // Corrected: r.expiry_date
                return days >= 0 && days < 30;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {records.filter(r => dayjs(r.expiry_date).diff(dayjs(), 'days') < 0).length} {/* Corrected: r.expiry_date */}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No training records found. Add your first record to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guard Name</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Expires Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow
                    key={record.id}
                    className={cn(getRowClass(record.expiry_date))} // Corrected: record.expiry_date
                  >
                    <TableCell className="font-medium">{record.guard_name_recorded}</TableCell> {/* Corrected: record.guard_name_recorded */}
                    <TableCell>{record.course_name}</TableCell> {/* Corrected: record.course_name */}
                    <TableCell>{dayjs(record.completed_date).format('DD/MM/YYYY')}</TableCell> {/* Corrected: record.completed_date */}
                    <TableCell>{dayjs(record.expiry_date).format('DD/MM/YYYY')}</TableCell> {/* Corrected: record.expiry_date */}
                    <TableCell>{getExpiryBadge(record.expiry_date)}</TableCell> {/* Corrected: record.expiry_date */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddTraining
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRecordAdded={handleRecordAdded}
      />
    </div>
  );
};

export default TrainingDashboard;
