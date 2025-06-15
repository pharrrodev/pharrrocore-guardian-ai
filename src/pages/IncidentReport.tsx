
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Step1IncidentType from '@/components/incident-reporting/Step1IncidentType';

interface ReportData {
  incidentType: string;
  // Future fields will be added here
}

const STEPS = [
    { number: 1, title: 'Incident Type' },
    { number: 2, title: 'Input Method' },
    { number: 3, title: 'Processing' },
    { number: 4, title: 'Validation & Review' },
    { number: 5, title: 'Report Preview' },
    { number: 6, title: 'Confirmation' },
    { number: 7, title: 'Download' },
];

const IncidentReport = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ReportData>>({});

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateFormData = (data: Partial<ReportData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1IncidentType formData={formData} updateFormData={updateFormData} />;
      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Step {currentStep}</h2>
            <p>This step is under construction.</p>
          </div>
        );
    }
  };

  const currentStepInfo = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-2xl">AI Incident Reporting Wizard</CardTitle>
              <Button asChild variant="ghost">
                <Link to="/">Cancel</Link>
              </Button>
            </div>
            <CardDescription>Step {currentStepInfo.number} of {STEPS.length}: {currentStepInfo.title}</CardDescription>
            <Progress value={(currentStep / STEPS.length) * 100} className="w-full mt-2" />
          </CardHeader>
          <CardContent className="min-h-[350px] flex items-center justify-center p-6">
            {renderStep()}
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            ) : (
              <div /> // Placeholder for alignment
            )}
            
            {!isLastStep ? (
              <Button onClick={nextStep} disabled={currentStep === 1 && !formData.incidentType}>
                Next
              </Button>
            ) : (
              <Button onClick={() => console.log('Submitting', formData)}>
                Confirm and Generate PDF
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default IncidentReport;
