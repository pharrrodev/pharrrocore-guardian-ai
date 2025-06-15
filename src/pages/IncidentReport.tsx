import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AnimatePresence, motion, type Easing, type Transition } from 'framer-motion';
import { toast } from 'sonner';

import Step1Date from '@/components/incident-reporting/Step1Date';
import Step2Time from '@/components/incident-reporting/Step2Time';
import Step3Location from '@/components/incident-reporting/Step3Location';
import Step4IncidentType from '@/components/incident-reporting/Step4IncidentType';
import Step5Description from '@/components/incident-reporting/Step5Description';
import Step6PeopleInvolved from '@/components/incident-reporting/Step6PeopleInvolved';
import Step7ActionsTaken from '@/components/incident-reporting/Step7ActionsTaken';
import ProcessingReportModal from '@/components/incident-reporting/ProcessingReportModal';
import FinalReport from '@/components/incident-reporting/FinalReport';

const TOTAL_STEPS = 7;

const IncidentReport = () => {
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
        return !formData.description || formData.description.trim() === '';
      case 6:
        return !formData.peopleInvolved || formData.peopleInvolved.length === 0;
      case 7:
        return !formData.actionsTaken || formData.actionsTaken.length === 0;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    const key = `${currentStep}-${direction}`;
    const transition: Transition = { duration: 0.3, ease: 'easeInOut' as Easing };
    const motionProps = {
        key: key,
        initial: { opacity: 0, x: direction * 100 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -direction * 100 },
        transition: transition,
    };

    switch (currentStep) {
      case 1:
        return <motion.div {...motionProps}><Step1Date formData={formData} updateFormData={updateFormData} /></motion.div>;
      case 2:
        return <motion.div {...motionProps}><Step2Time formData={formData} updateFormData={updateFormData} /></motion.div>;
      case 3:
        return <motion.div {...motionProps}><Step3Location formData={formData} updateFormData={updateFormData} /></motion.div>;
      case 4:
        return <motion.div {...motionProps}><Step4IncidentType formData={formData} updateFormData={updateFormData} /></motion.div>;
      case 5:
        return <motion.div {...motionProps}><Step5Description formData={formData} updateFormData={updateFormData} /></motion.div>;
      case 6:
        return <motion.div {...motionProps}><Step6PeopleInvolved formData={formData} updateFormData={updateFormData} /></motion.div>;
      case 7:
        return <motion.div {...motionProps}><Step7ActionsTaken formData={formData} updateFormData={updateFormData} /></motion.div>;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    // WARNING: API Key is hardcoded below for demonstration purposes.
    // This is not secure for a real application.
    // The recommended approach is to use environment variables as previously implemented.
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FinalReport formData={formData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ProcessingReportModal open={isProcessing} />
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            {currentStep > 1 ? (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : <div className="w-10 h-10" /> /* Placeholder to keep alignment */}
            <h2 className="text-2xl font-bold text-center">New Incident Report</h2>
            <div className="w-10 h-10" /> {/* Placeholder */}
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="w-full mt-4" />
        </CardHeader>
        <CardContent className="flex justify-center items-start py-8 min-h-[450px] overflow-hidden">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          {currentStep === TOTAL_STEPS ? (
            <Button size="lg" onClick={handleSubmit} disabled={isNextDisabled()}>
              Submit Report
            </Button>
          ) : (
            <Button size="lg" onClick={handleNext} disabled={isNextDisabled()}>
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default IncidentReport;
