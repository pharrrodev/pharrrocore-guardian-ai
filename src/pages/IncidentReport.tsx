
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Link } from 'react-router-dom';

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <FinalReport formData={formData} />
        <Button asChild className="mt-8">
          <Link to="/">Return to Dashboard</Link>
        </Button>
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
      <Card className="w-full max-w-3xl relative">
        <Button asChild variant="ghost" size="icon" className="absolute top-4 right-4 z-10">
          <Link to="/" aria-label="Go to dashboard">
            <Home className="h-5 w-5" />
          </Link>
        </Button>
        <CardHeader>
          <div className="flex items-center justify-center">
            <h2 className="text-2xl font-bold text-center">New Incident Report</h2>
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="w-full mt-4" />
        </CardHeader>
        <CardContent className="relative flex justify-center items-center py-8 min-h-[450px] overflow-hidden">
          <div className="flex items-center justify-between w-full max-w-3xl px-2 sm:px-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              disabled={isProcessing}
              className={`rounded-full h-10 w-10 shrink-0 transition-opacity duration-300 ${
                currentStep > 1 ? 'opacity-100' : 'invisible'
              }`}
              aria-label="Previous step"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="w-full flex-1 max-w-2xl px-4">
              <StepManager
                currentStep={currentStep}
                formData={formData}
                updateFormData={updateFormData}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={isNextDisabled() || isProcessing}
              className={`rounded-full h-10 w-10 shrink-0 transition-opacity duration-300 ${
                currentStep < TOTAL_STEPS ? 'opacity-100' : 'invisible'
              }`}
              aria-label="Next step"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
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
