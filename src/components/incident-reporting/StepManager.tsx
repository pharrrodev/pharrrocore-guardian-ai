
import Step1Date from '@/components/incident-reporting/Step1Date';
import Step2Time from '@/components/incident-reporting/Step2Time';
import Step3Location from '@/components/incident-reporting/Step3Location';
import Step4IncidentType from '@/components/incident-reporting/Step4IncidentType';
import Step5Description from '@/components/incident-reporting/Step5Description';
import Step6PeopleInvolved from '@/components/incident-reporting/Step6PeopleInvolved';
import Step7ActionsTaken from '@/components/incident-reporting/Step7ActionsTaken';

interface StepManagerProps {
    currentStep: number;
    formData: any;
    updateFormData: (data: object) => void;
}

const StepManager: React.FC<StepManagerProps> = ({ currentStep, formData, updateFormData }) => {
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
            return <Step6PeopleInvolved formData={formData} updateFormData={updateFormData} />;
        case 6:
            return <Step7ActionsTaken formData={formData} updateFormData={updateFormData} />;
        case 7:
            return <Step5Description formData={formData} updateFormData={updateFormData} />;
        default:
            return null;
    }
};

export default StepManager;
