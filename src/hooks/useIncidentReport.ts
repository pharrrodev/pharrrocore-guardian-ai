import { useState } from 'react';
import { toast } from 'sonner';

const TOTAL_STEPS = 7;

export const useIncidentReport = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    incidentDate: new Date(),
    peopleInvolved: [],
    actionsTaken: [],
  });
  const [direction, setDirection] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateFormData = (data: object) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };
  
  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !formData.incidentDate;
      case 2:
        return !formData.incidentTime;
      case 3:
        return !formData.location;
      case 4:
        return !formData.incidentType;
      case 5:
        return !formData.peopleInvolved || formData.peopleInvolved.length === 0;
      case 6:
        return !formData.actionsTaken || formData.actionsTaken.length === 0;
      case 7:
        return !formData.description || formData.description.trim() === '';
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    // WARNING: API Key is hardcoded below for demonstration purposes.
    // This is not secure for a real application.
    // The recommended approach is to use environment variables.
    const apiKey = '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';

    try {
      const prompt = `Rewrite the following incident description into a professional, formal report narrative suitable for a UK security context. The output should be a single paragraph. Be clear, concise, and objective. Use formal language and structure the information logically.
Original description: "${formData.description}"`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in writing professional UK security incident reports. Your tone is formal, objective, and clear. You convert informal notes into official report narratives. Provide only the rewritten paragraph, without any introductory phrases like "Here is the rewritten description:".'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let professionalDescription = data.choices[0].message.content.trim();

      professionalDescription = professionalDescription.replace(/^"|"$/g, '').trim();
      
      const updatedFormData = { ...formData, description: professionalDescription };
      setFormData(updatedFormData);
      console.log('Final Report Data with AI enhancement:', updatedFormData);

    } catch (error) {
      console.error('Error processing report with AI:', error);
      toast.error("AI enhancement failed. Submitting original report.", {
        description: "There was an issue communicating with the AI service.",
      });
    } finally {
      setIsProcessing(false);
      setIsSubmitted(true);
    }
  };

  return {
    currentStep,
    TOTAL_STEPS,
    formData,
    direction,
    isProcessing,
    isSubmitted,
    updateFormData,
    handleNext,
    handleBack,
    isNextDisabled,
    handleSubmit,
  };
};
