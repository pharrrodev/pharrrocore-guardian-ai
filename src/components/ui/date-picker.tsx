
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  disabled = false,
  className 
}) => {
  const [year, setYear] = useState<string | undefined>(value ? String(value.getFullYear()) : undefined);
  const [month, setMonth] = useState<string | undefined>(value ? String(value.getMonth()) : undefined);
  const [day, setDay] = useState<string | undefined>(value ? String(value.getDate()) : undefined);
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(currentYear - i));
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i),
      label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
    }));
  }, []);

  const daysInMonth = useMemo(() => {
    if (year && month) {
      const numDays = new Date(Number(year), Number(month) + 1, 0).getDate();
      return Array.from({ length: numDays }, (_, i) => String(i + 1));
    }
    return [];
  }, [year, month]);
  
  useEffect(() => {
    // When month or year changes, check if current day is valid.
    if (day && year && month) {
        const numDays = new Date(Number(year), Number(month) + 1, 0).getDate();
        if (Number(day) > numDays) {
            setDay(undefined); // Reset day
        }
    }
  }, [month, year, day]);

  useEffect(() => {
      if (year && month && day) {
          const selectedDate = new Date(Number(year), Number(month), Number(day));
          // Prevent future dates & invalid dates (e.g. Feb 30th)
          if (selectedDate > new Date() || selectedDate.getMonth() !== Number(month)) {
            onChange(undefined);
          } else {
            onChange(selectedDate);
          }
      } else {
          onChange(undefined);
      }
  }, [year, month, day, onChange]);

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    setMonth(undefined);
    setDay(undefined);
  };
  
  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    setDay(undefined);
  };

  return (
    <div className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}>
      <Select onValueChange={handleYearChange} value={year} disabled={disabled}>
        <SelectTrigger className="w-[120px] h-12 text-base">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={handleMonthChange} value={month} disabled={!year || disabled}>
        <SelectTrigger className="w-[150px] h-12 text-base">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map(m => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
  
      <Select onValueChange={setDay} value={day} disabled={!month || !year || disabled}>
        <SelectTrigger className="w-[100px] h-12 text-base">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {daysInMonth.map(d => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
