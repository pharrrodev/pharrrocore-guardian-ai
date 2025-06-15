
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Pocket, SprayCan, KeyRound, Users, HeartPulse, Siren, HardHat, MoreHorizontal } from 'lucide-react';

interface Step1Props {
  formData: { incidentType?: string };
  updateFormData: (data: { incidentType: string }) => void;
}

const incidentTypes = [
  { name: 'Theft', icon: Pocket },
  { name: 'Vandalism', icon: SprayCan },
  { name: 'Access Breach', icon: KeyRound },
  { name: 'Patron Concern', icon: Users },
  { name: 'Medical Emergency', icon: HeartPulse },
  { name: 'Alarm Activation', icon: Siren },
  { name: 'Health & Safety', icon: HardHat },
  { name: 'Other', icon: MoreHorizontal },
];

const Step1IncidentType: React.FC<Step1Props> = ({ formData, updateFormData }) => {
  const selectedType = formData.incidentType;

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-6 text-center">Select an Incident Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {incidentTypes.map((type) => (
          <Card
            key={type.name}
            onClick={() => updateFormData({ incidentType: type.name })}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50",
              selectedType === type.name && 'border-primary ring-2 ring-primary'
            )}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 aspect-square">
              <type.icon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-primary" />
              <p className="text-sm font-medium text-center">{type.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Step1IncidentType;
