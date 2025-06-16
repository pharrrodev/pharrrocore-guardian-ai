
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import dayjs from 'dayjs';

interface AddTrainingProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordAdded: () => void;
}

interface TrainingFormData {
  guardName: string;
  courseName: string;
  completedDate?: Date;
  expiresDate?: Date;
}

// Predefined list of guards - in a real app this would come from a database
const GUARD_NAMES = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'Emma Wilson',
  'David Davis',
  'Lisa Anderson',
  'Robert Taylor',
  'Jennifer Martinez',
  'William Garcia',
  'Ashley Rodriguez'
];

const AddTraining: React.FC<AddTrainingProps> = ({ isOpen, onClose, onRecordAdded }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TrainingFormData>({
    guardName: '',
    courseName: '',
    completedDate: undefined,
    expiresDate: undefined
  });

  const handleInputChange = (field: keyof TrainingFormData, value: string | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.guardName.trim()) return 'Guard name is required';
    if (!formData.courseName.trim()) return 'Course name is required';
    if (!formData.completedDate) return 'Completed date is required';
    if (!formData.expiresDate) return 'Expires date is required';
    
    const completedDate = dayjs(formData.completedDate);
    const expiresDate = dayjs(formData.expiresDate);
    
    if (!completedDate.isValid()) return 'Invalid completed date';
    if (!expiresDate.isValid()) return 'Invalid expires date';
    if (expiresDate.isBefore(completedDate)) return 'Expires date must be after completed date';
    
    return null;
  };

  const checkDuplicate = (): boolean => {
    try {
      const stored = localStorage.getItem('trainingRecords');
      if (!stored) return false;
      
      const records = JSON.parse(stored);
      return records.some((record: any) => 
        record.guardName.toLowerCase() === formData.guardName.toLowerCase() &&
        record.courseName.toLowerCase() === formData.courseName.toLowerCase() &&
        dayjs(record.expiresDate).isSame(dayjs(formData.expiresDate), 'day')
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    if (checkDuplicate()) {
      toast({
        title: 'Duplicate Record',
        description: 'A record with this guard name, course name, and expiry date already exists.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        guardName: formData.guardName,
        courseName: formData.courseName,
        completedDate: dayjs(formData.completedDate).format('YYYY-MM-DD'),
        expiresDate: dayjs(formData.expiresDate).format('YYYY-MM-DD')
      };

      const response = await fetch('/api/training-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'ok') {
          toast({
            title: 'Success',
            description: 'Training record added successfully'
          });
          
          setFormData({
            guardName: '',
            courseName: '',
            completedDate: undefined,
            expiresDate: undefined
          });
          
          onRecordAdded();
        } else {
          throw new Error('Failed to add record');
        }
      } else {
        throw new Error('Failed to add record');
      }
    } catch (error) {
      console.error('Error adding training record:', error);
      toast({
        title: 'Error',
        description: 'Failed to add training record. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        guardName: '',
        courseName: '',
        completedDate: undefined,
        expiresDate: undefined
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Training Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guardName">Guard Name</Label>
            <Select value={formData.guardName} onValueChange={(value) => handleInputChange('guardName', value)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a guard" />
              </SelectTrigger>
              <SelectContent>
                {GUARD_NAMES.map((guardName) => (
                  <SelectItem key={guardName} value={guardName}>
                    {guardName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              type="text"
              value={formData.courseName}
              onChange={(e) => handleInputChange('courseName', e.target.value)}
              placeholder="Enter course name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completedDate">Completed Date</Label>
            <DatePicker
              value={formData.completedDate}
              onChange={(date) => handleInputChange('completedDate', date)}
              placeholder="Select completed date"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresDate">Expires Date</Label>
            <DatePicker
              value={formData.expiresDate}
              onChange={(date) => handleInputChange('expiresDate', date)}
              placeholder="Select expires date"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTraining;
