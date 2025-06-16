
import { useState } from 'react';
import { toast } from 'sonner';
import { useSupabaseData } from './useSupabaseData';

export interface FormData {
  date: string;
  time: string;
  location: string;
  incidentType: string;
  description: string;
  peopleInvolved: Array<{
    name: string;
    role: string;
    contact: string;
  }>;
  actionsTaken: string;
  witnesses: Array<{
    name: string;
    contact: string;
  }>;
  injuries: boolean;
  injuryDetails: string;
  policeInvolved: boolean;
  policeDetails: string;
  followUpRequired: boolean;
  followUpDetails: string;
}

export const useIncidentReport = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinallySubmitting, setIsFinallySubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const { saveIncidentReport } = useSupabaseData();

  const TOTAL_STEPS = 7;

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    incidentType: '',
    description: '',
    peopleInvolved: [],
    actionsTaken: '',
    witnesses: [],
    injuries: false,
    injuryDetails: '',
    policeInvolved: false,
    policeDetails: '',
    followUpRequired: false,
    followUpDetails: ''
  });

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.date;
      case 2:
        return !!formData.time;
      case 3:
        return !!formData.location.trim();
      case 4:
        return !!formData.incidentType;
      case 5:
        return !!formData.description.trim();
      case 6:
        return formData.peopleInvolved.length > 0;
      case 7:
        return !!formData.actionsTaken.trim();
      default:
        return false;
    }
  };

  const isNextDisabled = () => {
    return !validateCurrentStep() || isProcessing;
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS && validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for potential issues
    const warnings = [];
    if (formData.injuries && !formData.injuryDetails.trim()) {
      warnings.push('Injuries reported but no details provided');
    }
    if (formData.policeInvolved && !formData.policeDetails.trim()) {
      warnings.push('Police involvement noted but no details provided');
    }
    if (formData.followUpRequired && !formData.followUpDetails.trim()) {
      warnings.push('Follow-up required but no details provided');
    }

    if (warnings.length > 0) {
      setValidationMessage(`Warning: ${warnings.join(', ')}. Do you want to proceed?`);
      setShowValidationWarning(true);
      setIsProcessing(false);
      return;
    }

    await submitReport();
  };

  const submitReport = async () => {
    setIsProcessing(false);
    setIsFinallySubmitting(true);
    
    // Simulate final submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save to Supabase
    const { error } = await saveIncidentReport(formData);
    
    if (error) {
      toast.error('Failed to submit incident report');
      setIsFinallySubmitting(false);
      return;
    }

    setIsFinallySubmitting(false);
    setIsSubmitted(true);
    toast.success('Incident report submitted successfully');
  };

  const onOpenChangeWarning = (open: boolean) => {
    setShowValidationWarning(open);
    if (!open) {
      setIsProcessing(false);
    }
  };

  return {
    currentStep,
    TOTAL_STEPS,
    formData,
    isProcessing,
    isFinallySubmitting,
    isSubmitted,
    updateFormData,
    handleNext,
    handleBack,
    isNextDisabled,
    handleSubmit,
    submitReport,
    showValidationWarning,
    onOpenChangeWarning,
    validationMessage,
  };
};
