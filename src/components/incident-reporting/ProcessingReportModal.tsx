
import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ProcessingReportModalProps {
  open: boolean;
}

const steps = ['Language Analysis', 'Format Conversion', 'Final Review'];

const ProcessingReportModal: React.FC<ProcessingReportModalProps> = ({ open }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open) {
      setProgress(0);
      setCurrentStep(0);
      timer = setInterval(() => {
        setProgress(oldProgress => {
          if (oldProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          const newProgress = oldProgress + 2.5; // for a 4s duration
          if (newProgress > 33 && currentStep === 0) setCurrentStep(1);
          if (newProgress > 66 && currentStep === 1) setCurrentStep(2);
          if (newProgress >= 100 && currentStep === 2) setCurrentStep(3);
          return newProgress;
        });
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [open, currentStep]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[525px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Processing Your Report</DialogTitle>
          <DialogDescription className="text-center">
            AI is enhancing your incident report with professional formatting
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 flex flex-col items-center justify-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <ShieldCheck className="w-16 h-16 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Analyzing Incident Details</h3>
          <p className="text-muted-foreground text-sm">Structuring UK security report format...</p>
          <div className="w-full mt-4">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-sm font-semibold">{Math.round(progress)}%</p>
            </div>
          </div>
          <div className="flex justify-around w-full mt-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 rounded-full transition-colors duration-300 ${
                  currentStep > index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessingReportModal;
