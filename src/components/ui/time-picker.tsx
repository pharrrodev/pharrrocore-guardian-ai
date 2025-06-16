
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select time", 
  disabled = false,
  className 
}) => {
  const initialTime = value?.split(':');
  const [hour, setHour] = useState<string | undefined>(initialTime?.[0] || undefined);
  const [minute, setMinute] = useState<string | undefined>(initialTime?.[1] || undefined);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    if (newHour && minute) {
      onChange(`${newHour}:${minute}`);
    } else {
      onChange('');
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    if (hour && newMinute) {
      onChange(`${hour}:${newMinute}`);
    } else {
      onChange('');
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className={cn("flex items-center justify-center gap-2 sm:gap-4", className)}>
      <Select onValueChange={handleHourChange} value={hour} disabled={disabled}>
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
      <Select onValueChange={handleMinuteChange} value={minute} disabled={disabled}>
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
  );
};
