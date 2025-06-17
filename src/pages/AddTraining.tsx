
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
// useToast from shadcn/ui is different from sonner. Assuming sonner is used project-wide.
// If using shadcn useToast, import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner'; // Using sonner for consistency
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { Users } from 'lucide-react'; // For guard select icon

interface AddTrainingProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordAdded: () => void; // Callback after successful record addition
}

interface TrainingFormData {
  guardNameDisplay: string; // For display in Select and for guard_name_recorded
  courseName: string;
  completedDate?: Date;
  expiresDate?: Date;
  // certificateUrl?: string; // Optional: if implementing file upload
}

interface GuardUser {
  id: string;
  name: string;
}

const AddTraining: React.FC<AddTrainingProps> = ({ isOpen, onClose, onRecordAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGuards, setIsLoadingGuards] = useState(true);
  const [availableGuards, setAvailableGuards] = useState<GuardUser[]>([]);
  const [selectedGuardUserId, setSelectedGuardUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<TrainingFormData>({
    guardNameDisplay: '',
    courseName: '',
    completedDate: undefined,
    expiresDate: undefined,
  });

  useEffect(() => {
    if (!isOpen) return; // Don't fetch if modal is not open

    const fetchGuards = async () => {
      setIsLoadingGuards(true);
      try {
        const { data: guardsData, error } = await supabase.functions.invoke('get-guard-list');
        if (error) throw error;
        if (guardsData) {
          setAvailableGuards(guardsData.map((g: any) => ({ id: g.id, name: g.name || g.email })));
        } else {
          setAvailableGuards([]);
        }
      } catch (err) {
        console.error("Error fetching guards for training form:", err);
        sonnerToast.error("Failed to load guard list.");
        setAvailableGuards([]);
      } finally {
        setIsLoadingGuards(false);
      }
    };
    fetchGuards();
  }, [isOpen]); // Re-fetch if modal is reopened

  const handleInputChange = (field: keyof TrainingFormData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardSelection = (guardId: string) => {
    const selectedGuard = availableGuards.find(g => g.id === guardId);
    if (selectedGuard) {
      setSelectedGuardUserId(selectedGuard.id);
      handleInputChange('guardNameDisplay', selectedGuard.name);
    } else {
      setSelectedGuardUserId(null);
      handleInputChange('guardNameDisplay', ''); // Clear if selection is invalid/cleared
    }
  };

  const resetForm = () => {
    setFormData({
      guardNameDisplay: '',
      courseName: '',
      completedDate: undefined,
      expiresDate: undefined,
    });
    setSelectedGuardUserId(null);
  };

  const validateForm = (): string | null => {
    if (!selectedGuardUserId && !formData.guardNameDisplay.trim()) return 'Please select or enter a guard name';
    if (!formData.guardNameDisplay.trim()) return 'Guard name cannot be empty if no user is selected';
    if (!formData.courseName.trim()) return 'Please enter a course name';
    if (!formData.completedDate) return 'Please select when the training was completed';
    if (!formData.expiresDate) return 'Please select when the training expires';
    
    const completedDate = dayjs(formData.completedDate);
    const expiresDate = dayjs(formData.expiresDate);
    
    if (!completedDate.isValid()) return 'Please select a valid completion date';
    if (!expiresDate.isValid()) return 'Please select a valid expiry date';
    if (expiresDate.isBefore(completedDate)) return 'Expiry date must be after completion date';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      sonnerToast.error(validationError, { title: 'Validation Error' });
      return;
    }

    setIsLoading(true);

    const submitData = {
      guard_user_id: selectedGuardUserId, // This can be null if no Supabase user selected
      guard_name_recorded: formData.guardNameDisplay,
      course_name: formData.courseName,
      completed_date: dayjs(formData.completedDate).format('YYYY-MM-DD'),
      expiry_date: dayjs(formData.expiresDate).format('YYYY-MM-DD'),
      // certificate_url: formData.certificateUrl || null, // If implemented
    };

    try {
      const { data: responseData, error: functionsError } = await supabase.functions.invoke(
        'add-training-record',
        { body: submitData }
      );

      if (functionsError) {
         // Check for specific error messages from the function, e.g., duplicate
        const errorMessage = functionsError.context?.message || functionsError.message || 'An unknown error occurred.';
        if (functionsError.context?.status === 409) { // Assuming 409 for duplicate from edge function
             sonnerToast.error('Duplicate Record', { description: errorMessage });
        } else {
            sonnerToast.error('Operation Failed', { description: `Failed to add record: ${errorMessage}` });
        }
        throw functionsError; // Throw to be caught by outer catch
      }

      if (responseData) { // Edge function should return success message in data
        sonnerToast.success('Success', { description: responseData.message || 'Training record added successfully' });
        resetForm();
        onRecordAdded(); // Call callback to refresh parent component's list
        // onClose(); // Close modal on success, can be part of onRecordAdded if preferred
      } else {
         // Should not happen if no error, but good to handle
         throw new Error('No response data from function.');
      }

    } catch (error) {
      console.error('Error adding training record:', error);
      // Toast for specific errors already shown, this is a fallback
      if (!functionsError) { // Avoid double-toasting if already handled
         sonnerToast.error('Error', { description: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[480px]"> {/* Slightly wider */}
        <DialogHeader>
          <DialogTitle>Add New Training Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="guardNameSelect">Guard Name</Label>
            <Select
              value={selectedGuardUserId || formData.guardNameDisplay} // Use guard_id if available, else the name string for non-user case
              onValueChange={handleGuardSelection}
              disabled={isLoading || isLoadingGuards}
            >
              <SelectTrigger id="guardNameSelect">
                <SelectValue placeholder="Select a guard or type name" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingGuards ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading guards...</div>
                ) : availableGuards.length > 0 ? (
                  availableGuards.map((guard) => (
                    <SelectItem key={guard.id} value={guard.id}>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                        {guard.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No system users found. Type name manually.</div>
                )}
              </SelectContent>
            </Select>
            {/* Fallback or manual entry for guardNameDisplay if no system user is selected,
                or if the list is empty and you still want to allow manual name entry.
                For this version, the Select's value is tied to guardNameDisplay if selectedGuardUserId is null.
                If no user is selected from dropdown, guardNameDisplay can be typed if input is changed to text.
                For simplicity with Select, if a guard isn't in the list, they can't be "selected" as a user ID.
                The current setup requires selection if list is populated.
                If manual entry is needed alongside selection, UI needs adjustment.
                For now, guardNameDisplay is set via handleGuardSelection.
            */}
             <Input
                id="guardNameDisplay"
                type="text"
                value={formData.guardNameDisplay}
                onChange={(e) => {
                    handleInputChange('guardNameDisplay', e.target.value);
                    // If user types, assume it's not a selection from list unless list is re-selected
                    setSelectedGuardUserId(null);
                }}
                placeholder="Enter guard name if not in list"
                disabled={isLoading}
                className="mt-2"
            />
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
              allowFuture={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresDate">Expires Date</Label>
            <DatePicker
              value={formData.expiresDate}
              onChange={(date) => handleInputChange('expiresDate', date)}
              placeholder="Select expires date"
              disabled={loading}
              allowFuture={true}
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
