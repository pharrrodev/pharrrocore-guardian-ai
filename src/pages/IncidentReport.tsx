import { ArrowLeft, ArrowRight } from 'lucide-react';
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
        <CardContent className="relative flex justify-center items-center py-8 min-h-[450px] overflow-hidden">
          {currentStep > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              disabled={isProcessing}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <AnimatePresence mode="wait">
            <StepManager 
              currentStep={currentStep}
              direction={direction}
              formData={formData}
              updateFormData={updateFormData}
            />
          </AnimatePresence>

          {currentStep < TOTAL_STEPS && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={isNextDisabled() || isProcessing}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full h-10 w-10"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {currentStep === TOTAL_STEPS ? (
            <Button size="lg" onClick={handleSubmit} disabled={isNextDisabled() || isProcessing}>
              {getSubmitButtonText()}
            </Button>
          ) : (
            <div className="h-11" />
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default IncidentReport;
