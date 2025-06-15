
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step5DescriptionProps {
  formData: { description?: string };
  updateFormData: (data: { description: string }) => void;
}

const Step5Description: React.FC<Step5DescriptionProps> = ({ formData, updateFormData }) => {
  const [description, setDescription] = useState(formData.description || '');

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    updateFormData({ description: newDescription });
  };

  return (
    <div className="w-full max-w-lg text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <FileText className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">Describe the incident</h3>
      <p className="text-muted-foreground mb-6">Provide a detailed, factual account of what happened. This is the primary field for manual entry.</p>
      
      <Textarea
        placeholder="Be clear, concise, and objective. Describe the sequence of events, people involved, and actions taken..."
        value={description}
        onChange={handleDescriptionChange}
        className="h-[320px] text-base resize-none"
        required
      />

      <div
        className={cn(
          "min-h-[60px] flex items-center justify-center mt-4 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm",
          description ? "invisible" : "visible"
        )}
      >
        Please provide a description of the incident.
      </div>
    </div>
  );
};

export default Step5Description;
