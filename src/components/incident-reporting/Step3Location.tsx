
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Step3LocationProps {
  formData: { location?: string };
  updateFormData: (data: { location: string }) => void;
}

const locations = [
  "Main Entrance / Reception Area",
  "Delivery Bay (Rear of Unit 7)",
  "Car Park(s)",
  "Perimeter Fencing / Gates",
  "Common Areas",
  "Fire Exits",
  "Plant Rooms",
  "Waste Management Area",
  "Roof Access Points",
  "Data Centre (Floor 2)",
  "Data Centre (Floor 3)",
  "Security Office",
  "Other (specify in description)",
];

const Step3Location: React.FC<Step3LocationProps> = ({ formData, updateFormData }) => {
  const [location, setLocation] = useState(formData.location || '');

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    updateFormData({ location: newLocation });
  };

  return (
    <div className="w-full text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">Where did the incident occur?</h3>
      <p className="text-muted-foreground mb-6">Select the location from the list. Be more specific in the description if needed.</p>
      
      <Select onValueChange={handleLocationChange} value={location} required>
        <SelectTrigger className="h-12 text-base">
          <SelectValue placeholder="Select a location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div
        className={cn(
          "min-h-[60px] flex items-center justify-center mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm",
          location ? "invisible" : "visible"
        )}
      >
        Please select a location.
      </div>
    </div>
  );
};

export default Step3Location;
