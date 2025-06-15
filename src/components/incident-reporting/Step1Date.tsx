
import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Step1DateProps {
  formData: { incidentDate?: Date };
  updateFormData: (data: { incidentDate: Date }) => void;
}

const Step1Date: React.FC<Step1DateProps> = ({ formData, updateFormData }) => {
  const [date, setDate] = React.useState<Date | undefined>(formData.incidentDate);

  const handleDateSelect = (selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
      updateFormData({ incidentDate: selectedDate });
    }
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
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-12 text-base",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Select a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground mt-2 text-left">Cannot select future dates.</p>
      {!date && (
          <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm">
            Please select an incident date
          </div>
      )}
    </div>
  );
};

export default Step1Date;
