
import React, { useState } from 'react';
import { Users2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Step6PeopleInvolvedProps {
  formData: { peopleInvolved?: string[] };
  updateFormData: (data: { peopleInvolved: string[] }) => void;
}

const peopleOptions = [
    'Emergency Services (Police, Fire, Ambulance)',
    'Security Control Room',
    'Site Supervisor',
    'Client Main Contact',
    'Maintenance / Facilities',
    'Tenants / Staff',
    'Visitors',
    'Contractors',
    'Witnesses',
    'Suspect(s)',
    'Other (specify in description)'
];

const Step6PeopleInvolved: React.FC<Step6PeopleInvolvedProps> = ({ formData, updateFormData }) => {
  const [selectedPeople, setSelectedPeople] = useState<string[]>(formData.peopleInvolved || []);

  const handleCheckboxChange = (person: string) => {
    const newSelectedPeople = selectedPeople.includes(person)
      ? selectedPeople.filter((p) => p !== person)
      : [...selectedPeople, person];
    setSelectedPeople(newSelectedPeople);
    updateFormData({ peopleInvolved: newSelectedPeople });
  };

  return (
    <div className="w-full max-w-lg text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <Users2 className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">Who was involved or notified?</h3>
      <p className="text-muted-foreground mb-6">Select all that apply.</p>
      
      <div className="space-y-3 text-left grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        {peopleOptions.map((person) => (
          <div key={person} className="flex items-center space-x-3">
            <Checkbox
              id={person}
              checked={selectedPeople.includes(person)}
              onCheckedChange={() => handleCheckboxChange(person)}
            />
            <Label htmlFor={person} className="font-normal cursor-pointer text-sm">{person}</Label>
          </div>
        ))}
      </div>
       {selectedPeople.length === 0 && (
          <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm">
            Please select at least one option.
          </div>
      )}
    </div>
  );
};

export default Step6PeopleInvolved;
