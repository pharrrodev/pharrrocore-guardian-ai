
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AnimatePresence } from 'framer-motion';

import { useIncidentReport } from '@/hooks/useIncidentReport';
import ProcessingReportModal from '@/components/incident-reporting/ProcessingReportModal';
import FinalReport from '@/components/incident-reporting/FinalReport';
import StepManager from '@/components/incident-reporting/StepManager';
import ValidationWarningDialog from '@/components/incident-reporting/ValidationWarningDialog';

const IncidentReport = () => {
  const {
    currentStep,
    TOTAL_STEPS,
    formData,
    direction,
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
  } = useIncidentReport();

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FinalReport formData={formData} />
      </div>
    );
  }

  const getSubmitButtonText = () => {
    if (isProcessing && !isFinallySubmitting) return 'Validating...';
    if (isFinallySubmitting) return 'Submitting...';
    return 'Submit Report';
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ProcessingReportModal open={isFinallySubmitting} />
      <ValidationWarningDialog
        open={showValidationWarning}
        onOpenChange={onOpenChangeWarning}
        message={validationMessage}
        onConfirm={submitReport}
      />
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-center">
            <h2 className="text-2xl font-bold text-center">New Incident Report</h2>
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
        <CardFooter className="flex justify-between items-center">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" size="lg" onClick={handleBack} disabled={isProcessing}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
            )}
          </div>

          {currentStep === TOTAL_STEPS ? (
            <Button size="lg" onClick={handleSubmit} disabled={isNextDisabled() || isProcessing}>
              {getSubmitButtonText()}
            </Button>
          ) : (
            <Button size="lg" onClick={handleNext} disabled={isNextDisabled() || isProcessing}>
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default IncidentReport;
