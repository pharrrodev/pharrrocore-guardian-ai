
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Step2TimeProps {
  formData: { incidentTime?: string };
  updateFormData: (data: { incidentTime: string }) => void;
}

const Step2Time: React.FC<Step2TimeProps> = ({ formData, updateFormData }) => {
  const [time, setTime] = useState(formData.incidentTime || '');

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    updateFormData({ incidentTime: newTime });
  };

  return (
    <div className="w-full max-w-md text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <Clock className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">What time did the incident occur?</h3>
      <p className="text-muted-foreground mb-6">Please specify the time of the incident.</p>
      
      <Input
        type="time"
        value={time}
        onChange={handleTimeChange}
        className="h-12 text-base"
        required
      />

      {!time && (
        <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm">
          Please select an incident time.
        </div>
      )}
    </div>
  );
};

export default Step2Time;
