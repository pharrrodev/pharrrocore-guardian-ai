
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Step3LocationProps {
  formData: { location?: string };
  updateFormData: (data: { location: string }) => void;
}

const Step3Location: React.FC<Step3LocationProps> = ({ formData, updateFormData }) => {
  const [location, setLocation] = useState(formData.location || '');

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    updateFormData({ location: newLocation });
  };

  return (
    <div className="w-full max-w-md text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">Where did the incident occur?</h3>
      <p className="text-muted-foreground mb-6">Be as specific as possible (e.g., "Main Lobby, near entrance A").</p>
      
      <Input
        type="text"
        placeholder="Enter location"
        value={location}
        onChange={handleLocationChange}
        className="h-12 text-base"
        required
      />

      {!location && (
        <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm">
          Please enter a location.
        </div>
      )}
    </div>
  );
};

export default Step3Location;
