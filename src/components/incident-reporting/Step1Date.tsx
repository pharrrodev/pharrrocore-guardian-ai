import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Step1DateProps {
  formData: { incidentDate?: Date };
  updateFormData: (data: { incidentDate?: Date }) => void;
}

const Step1Date: React.FC<Step1DateProps> = ({ formData, updateFormData }) => {
  const initialDate = formData.incidentDate || new Date();

  const [year, setYear] = useState<string | undefined>(String(initialDate.getFullYear()));
  const [month, setMonth] = useState<string | undefined>(String(initialDate.getMonth()));
  const [day, setDay] = useState<string | undefined>(String(initialDate.getDate()));
  
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
            updateFormData({ incidentDate: undefined });
          } else {
            updateFormData({ incidentDate: selectedDate });
          }
      } else {
          updateFormData({ incidentDate: undefined });
      }
  }, [year, month, day, updateFormData]);

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
    <div className="w-full max-w-md text-center">
      <div className="flex justify-center mb-6">
          <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
              <CalendarIcon className="w-10 h-10 text-primary" />
          </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">What was the date of the incident?</h3>
      <p className="text-muted-foreground mb-6">Please select the date when the incident occurred.</p>
      
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <Select onValueChange={handleYearChange} value={year}>
          <SelectTrigger className="w-[120px] h-12 text-base">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handleMonthChange} value={month} disabled={!year}>
          <SelectTrigger className="w-[150px] h-12 text-base">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
    
        <Select onValueChange={setDay} value={day} disabled={!month || !year}>
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
      
      <p className="text-sm text-muted-foreground mt-2 text-left">Cannot select future dates.</p>
      <div className="min-h-[60px]">
        {!formData.incidentDate && (
            <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm">
              Please select a valid incident date
            </div>
        )}
      </div>
    </div>
  );
};

export default Step1Date;
