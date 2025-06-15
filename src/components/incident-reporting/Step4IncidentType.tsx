
import React from 'react';
import {
  Pocket,
  Hammer,
  KeyRound,
  Users,
  HeartPulse,
  TriangleAlert,
  MoreHorizontal,
  Flame,
  Bomb,
  PowerOff,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Step4IncidentTypeProps {
  formData: { incidentType?: string };
  updateFormData: (data: { incidentType: string }) => void;
}

const incidentTypes = [
  { name: 'Theft', icon: Pocket },
  { name: 'Vandalism', icon: Hammer },
  { name: 'Access Breach', icon: KeyRound },
  { name: 'Disturbance', icon: Users },
  { name: 'Medical Emergency', icon: HeartPulse },
  { name: 'Fire / Alarm', icon: Flame },
  { name: 'Health & Safety', icon: TriangleAlert },
  { name: 'Bomb Threat', icon: Bomb },
  { name: 'Power Failure', icon: PowerOff },
  { name: 'Equipment Fault', icon: Wrench },
  { name: 'Other', icon: MoreHorizontal },
];

const Step4IncidentType: React.FC<Step4IncidentTypeProps> = ({ formData, updateFormData }) => {
  const selectedType = formData.incidentType;

  return (
    <div className="w-full max-w-2xl text-center">
      <h3 className="text-xl font-semibold mb-2">What type of incident is this?</h3>
      <p className="text-muted-foreground mb-6">Select the category that best describes the incident.</p>
      
      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {incidentTypes.map((type) => (
            <Button
              key={type.name}
              variant="outline"
              className={cn(
                "flex flex-col items-center justify-center h-28 text-center p-4 transition-all",
                selectedType === type.name ? "border-primary ring-2 ring-primary bg-primary/10" : "hover:bg-accent/50"
              )}
              onClick={() => updateFormData({ incidentType: type.name })}
            >
              <type.icon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">{type.name}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {!selectedType && (
          <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm">
            Please select an incident type.
          </div>
      )}
    </div>
  );
};

export default Step4IncidentType;
