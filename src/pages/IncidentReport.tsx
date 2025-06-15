
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Step1Date from '@/components/incident-reporting/Step1Date';

interface ReportData {
  incidentType?: string;
  incidentDate?: Date;
  // Future fields will be added here
}

const STEPS = [
    { number: 1, title: 'Incident Date' },
    { number: 2, title: 'Incident Time' },
    { number: 3, title: 'Location' },
    { number: 4, title: 'Incident Type' },
    { number: 5, title: 'Actions & Evidence' },
    { number: 6, 'title': 'Description' },
    { number: 7, title: 'Report Preview' },
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
        return <Step1Date formData={formData} updateFormData={updateFormData} />;
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
              <CardTitle className="text-2xl">Create Incident Report</CardTitle>
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
              <Button onClick={nextStep} disabled={currentStep === 1 && !formData.incidentDate}>
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
