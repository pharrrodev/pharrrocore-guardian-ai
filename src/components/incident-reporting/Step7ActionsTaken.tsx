
import React, { useEffect } from 'react';
import { ListChecks } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { allActions, incidentActionsMapping } from '@/data/incidentActionsMapping';
import { cn } from '@/lib/utils';

interface Step7ActionsTakenProps {
  formData: {
    // actionsTaken here is locally a string[], but the main hook expects string
    // For this component, we'll receive the string from formData, parse it, and send string back up.
    actionsTaken?: string; // Changed from string[] to string to match hook's FormData
    incidentType?: string;
    otherActionDetails?: string;
  };
  // updateFormData in the hook expects Partial<FormData>, so actionsTaken should be string
  updateFormData: (data: { actionsTaken?: string; otherActionDetails?: string }) => void;
}

const Step7ActionsTaken: React.FC<Step7ActionsTakenProps> = ({ formData, updateFormData }) => {
  // Parse actionsTaken string into an array for checkbox management
  const initialActionsArray = formData.actionsTaken ? formData.actionsTaken.split(',').map(s => s.trim()).filter(s => s) : [];
  const [selectedActionsArray, setSelectedActionsArray] = React.useState<string[]>(initialActionsArray);

  const { incidentType, otherActionDetails = '' } = formData;

  // Effect to update local array if formData.actionsTaken changes from parent (e.g. on step back/fwd)
  React.useEffect(() => {
    setSelectedActionsArray(formData.actionsTaken ? formData.actionsTaken.split(',').map(s => s.trim()).filter(s => s) : []);
  }, [formData.actionsTaken]);

  const relevantActions = incidentType ? (incidentActionsMapping[incidentType] || allActions) : allActions;

  useEffect(() => {
    // When the incident type changes, filter out any selected actions from the local array
    // that are no longer relevant according to the new incidentType.
    const currentlySelectedAndRelevant = selectedActionsArray.filter(action => relevantActions.includes(action));
    if (currentlySelectedAndRelevant.length !== selectedActionsArray.length) {
      setSelectedActionsArray(currentlySelectedAndRelevant);
      updateFormData({ actionsTaken: currentlySelectedAndRelevant.join(', ') });
      // Also, if "Other" was deselected as part of this, clear its details
      if (!currentlySelectedAndRelevant.includes(OTHER_ACTION_STRING)) {
        updateFormData({ otherActionDetails: '' });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentType, relevantActions, updateFormData]); // formData.actionsTaken removed from deps to avoid loop, selectedActionsArray manages it now

  // This effect syncs the parent form's actionsTaken string if the local array changes
  // This might be redundant if all updates to selectedActionsArray also call updateFormData
  // React.useEffect(() => {
  //  const currentActionsString = selectedActionsArray.join(', ');
  //  if (currentActionsString !== formData.actionsTaken) {
  //    updateFormData({ actionsTaken: currentActionsString });
  //  }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedActionsArray, updateFormData]);


  const handleCheckboxChange = (action: string) => {
    const newArray = selectedActionsArray.includes(action)
      ? selectedActionsArray.filter((a) => a !== action)
      : [...selectedActionsArray, action];
    setSelectedActionsArray(newArray);

    const actionsString = newArray.join(', ');

    if (action === OTHER_ACTION_STRING && !newArray.includes(OTHER_ACTION_STRING)) {
      updateFormData({ actionsTaken: actionsString, otherActionDetails: '' });
    } else {
      updateFormData({ actionsTaken: actionsString });
    }
  };

  const handleOtherDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ otherActionDetails: e.target.value });
  };

  // Define the "Other" action string to check against
  const OTHER_ACTION_STRING = "Other (specify in description)";

  return (
    <div className="w-full max-w-lg text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <ListChecks className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">What actions were taken?</h3>
      <p className="text-muted-foreground mb-6">
        {incidentType ? `Actions related to the ${incidentType.toLowerCase()} incident.` : 'Select all that apply.'}
      </p>
      
      <div className="rounded-md border text-left p-4">
        <div className="space-y-3 text-left grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {relevantActions.map((action) => (
            <div key={action} className="flex items-center space-x-3">
              <Checkbox
                id={action}
                checked={selectedActionsArray.includes(action)} // Use local array state for checked status
                onCheckedChange={() => handleCheckboxChange(action)}
              />
              <Label htmlFor={action} className="font-normal cursor-pointer text-sm">{action}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Conditionally render Textarea for "Other" details */}
      {selectedActionsArray.includes(OTHER_ACTION_STRING) && ( // Use local array state
        <div className="mt-4 text-left">
          <Label htmlFor="otherActionDetails" className="font-semibold">
            Details for 'Other' Action:
          </Label>
          <Textarea
            id="otherActionDetails"
            value={otherActionDetails}
            onChange={handleOtherDetailsChange}
            placeholder="Please specify the other actions taken..."
            className="mt-2"
            rows={3}
          />
        </div>
      )}

       <div
        className={cn(
          "min-h-[60px] flex items-center justify-center mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm",
          selectedActionsArray.length > 0 ? "invisible" : "visible" // Use local array state
        )}
      >
        Please select at least one action.
      </div>
    </div>
  );
};

export default Step7ActionsTaken;
