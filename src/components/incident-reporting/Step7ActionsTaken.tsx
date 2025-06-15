
import React, { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Step7ActionsTakenProps {
  formData: { actionsTaken?: string[] };
  updateFormData: (data: { actionsTaken: string[] }) => void;
}

const actionsOptions = [
    'Called 999',
    'Called Control Room',
    'Called Site Supervisor',
    'Provided First Aid',
    'Used Defibrillator (AED)',
    'Initiated Building Evacuation',
    'Used Fire Extinguisher',
    'Attempted to De-escalate',
    'Secured Scene',
    'Gathered Witness Information',
    'Checked CCTV',
    'Completed Live Logbook Entry',
    'Other (specify in description)'
];


const Step7ActionsTaken: React.FC<Step7ActionsTakenProps> = ({ formData, updateFormData }) => {
  const [selectedActions, setSelectedActions] = useState<string[]>(formData.actionsTaken || []);

  const handleCheckboxChange = (action: string) => {
    const newSelectedActions = selectedActions.includes(action)
      ? selectedActions.filter((a) => a !== action)
      : [...selectedActions, action];
    setSelectedActions(newSelectedActions);
    updateFormData({ actionsTaken: newSelectedActions });
  };

  return (
    <div className="w-full max-w-lg text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <ListChecks className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">What actions were taken?</h3>
      <p className="text-muted-foreground mb-6">Select all that apply.</p>
      
      <div className="space-y-3 text-left grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {actionsOptions.map((action) => (
          <div key={action} className="flex items-center space-x-3">
            <Checkbox
              id={action}
              checked={selectedActions.includes(action)}
              onCheckedChange={() => handleCheckboxChange(action)}
            />
            <Label htmlFor={action} className="font-normal cursor-pointer text-sm">{action}</Label>
          </div>
        ))}
      </div>
       {selectedActions.length === 0 && (
          <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm">
            Please select at least one action.
          </div>
      )}
    </div>
  );
};

export default Step7ActionsTaken;
