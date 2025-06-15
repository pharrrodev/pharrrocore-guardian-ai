
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AnimatePresence } from 'framer-motion';

import { useIncidentReport } from '@/hooks/useIncidentReport';
import ProcessingReportModal from '@/components/incident-reporting/ProcessingReportModal';
import FinalReport from '@/components/incident-reporting/FinalReport';
import StepManager from '@/components/incident-reporting/StepManager';

const IncidentReport = () => {
  const {
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
  } = useIncidentReport();

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
            <StepManager 
              currentStep={currentStep}
              direction={direction}
              formData={formData}
              updateFormData={updateFormData}
            />
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

