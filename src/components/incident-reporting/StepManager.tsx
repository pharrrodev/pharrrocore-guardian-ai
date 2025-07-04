
import Step1Date from '@/components/incident-reporting/Step1Date';
import Step2Time from '@/components/incident-reporting/Step2Time';
import Step3Location from '@/components/incident-reporting/Step3Location';
import Step4IncidentType from '@/components/incident-reporting/Step4IncidentType';
import Step5Description from '@/components/incident-reporting/Step5Description';
import Step6PeopleInvolved from '@/components/incident-reporting/Step6PeopleInvolved';
import Step7ActionsTaken from '@/components/incident-reporting/Step7ActionsTaken';

interface StaffMember { // Define a simple interface for staff members
  id: string;
  name: string;
}
import { FormData as IncidentFormData } from '@/hooks/useIncidentReport'; // Import and alias

interface StepManagerProps {
    currentStep: number;
    formData: IncidentFormData; // Use the imported type
    updateFormData: (data: Partial<IncidentFormData>) => void; // Use Partial for updates
    availableStaff?: StaffMember[]; // Optional: pass down from parent
    isLoadingStaff?: boolean;      // Optional: pass down from parent
}

const StepManager: React.FC<StepManagerProps> = ({
    currentStep,
    formData,
    updateFormData,
    availableStaff,
    isLoadingStaff
}) => {
    switch (currentStep) {
        case 1:
            return <Step1Date formData={formData} updateFormData={updateFormData} />;
        case 2:
            return <Step2Time formData={formData} updateFormData={updateFormData} />;
        case 3:
            return <Step3Location formData={formData} updateFormData={updateFormData} />;
        case 4:
            return <Step4IncidentType formData={formData} updateFormData={updateFormData} />;
        case 5:
            return <Step5Description formData={formData} updateFormData={updateFormData} />;
        case 6:
            // Pass availableStaff and isLoadingStaff to Step6PeopleInvolved
            return <Step6PeopleInvolved
                      formData={formData}
                      updateFormData={updateFormData}
                      availableStaff={availableStaff || []}
                      isLoadingStaff={isLoadingStaff || false}
                    />;
        case 7:
            return <Step7ActionsTaken formData={formData} updateFormData={updateFormData} />;
        default:
            return null;
    }
};

export default StepManager;
