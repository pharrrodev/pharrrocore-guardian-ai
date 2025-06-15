
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Step2TimeProps {
  formData: { incidentTime?: string };
  updateFormData: (data: { incidentTime: string }) => void;
}

const Step2Time: React.FC<Step2TimeProps> = ({ formData, updateFormData }) => {
  const initialTime = formData.incidentTime?.split(':');
  const [hour, setHour] = useState<string | undefined>(initialTime?.[0] || undefined);
  const [minute, setMinute] = useState<string | undefined>(initialTime?.[1] || undefined);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    if (newHour && minute) {
      updateFormData({ incidentTime: `${newHour}:${minute}` });
    } else {
      updateFormData({ incidentTime: '' });
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    if (hour && newMinute) {
      updateFormData({ incidentTime: `${hour}:${newMinute}` });
    } else {
      updateFormData({ incidentTime: '' });
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="w-full max-w-md text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <Clock className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">What time did the incident occur?</h3>
      <p className="text-muted-foreground mb-6">Please specify the time of the incident.</p>
      
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <Select onValueChange={handleHourChange} value={hour}>
          <SelectTrigger className="w-[100px] sm:w-[120px] h-12 text-base">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hours.map(h => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-2xl font-bold">:</span>
        <Select onValueChange={handleMinuteChange} value={minute}>
          <SelectTrigger className="w-[100px] sm:w-[120px] h-12 text-base">
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "min-h-[60px] flex items-center justify-center mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm",
          formData.incidentTime ? "invisible" : "visible"
        )}
      >
        Please select an incident time.
      </div>
    </div>
  );
};

export default Step2Time;
