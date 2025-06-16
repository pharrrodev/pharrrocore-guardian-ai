
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import AddTraining from './AddTraining';

interface TrainingRecord {
  id: string;
  guardId: string;
  guardName: string;
  courseName: string;
  completedDate: string;
  expiresDate: string;
}

const TrainingDashboard = () => {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTrainingRecords = () => {
    // In a real app, this would fetch from the CSV file
    // For now, we'll use localStorage to simulate the data
    try {
      const stored = localStorage.getItem('trainingRecords');
      if (stored) {
        setRecords(JSON.parse(stored));
      }
    } catch (error) {
      console.log('No training records found');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrainingRecords();
  }, []);

  const getRowClass = (expiresDate: string) => {
    const daysUntilExpiry = dayjs(expiresDate).diff(dayjs(), 'days');
    
    if (daysUntilExpiry < 0) {
      return 'bg-red-50 border-red-200';
    } else if (daysUntilExpiry < 7) {
      return 'bg-red-50 border-red-200';
    } else if (daysUntilExpiry < 30) {
      return 'bg-yellow-50 border-yellow-200';
    }
    return '';
  };

  const getExpiryBadge = (expiresDate: string) => {
    const daysUntilExpiry = dayjs(expiresDate).diff(dayjs(), 'days');
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiry < 7) {
      return <Badge variant="destructive">{daysUntilExpiry} days left</Badge>;
    } else if (daysUntilExpiry < 30) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{daysUntilExpiry} days left</Badge>;
    }
    return <Badge variant="outline">{daysUntilExpiry} days left</Badge>;
  };

  const handleRecordAdded = () => {
    loadTrainingRecords();
    setIsAddModalOpen(false);
  };

  if (loading) {
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
                const days = dayjs(r.expiresDate).diff(dayjs(), 'days');
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
              {records.filter(r => dayjs(r.expiresDate).diff(dayjs(), 'days') < 0).length}
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
                    className={cn(getRowClass(record.expiresDate))}
                  >
                    <TableCell className="font-medium">{record.guardName}</TableCell>
                    <TableCell>{record.courseName}</TableCell>
                    <TableCell>{dayjs(record.completedDate).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{dayjs(record.expiresDate).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{getExpiryBadge(record.expiresDate)}</TableCell>
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
