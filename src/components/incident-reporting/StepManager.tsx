
import { motion, type Easing, type Transition } from 'framer-motion';

import Step1Date from '@/components/incident-reporting/Step1Date';
import Step2Time from '@/components/incident-reporting/Step2Time';
import Step3Location from '@/components/incident-reporting/Step3Location';
import Step4IncidentType from '@/components/incident-reporting/Step4IncidentType';
import Step5Description from '@/components/incident-reporting/Step5Description';
import Step6PeopleInvolved from '@/components/incident-reporting/Step6PeopleInvolved';
import Step7ActionsTaken from '@/components/incident-reporting/Step7ActionsTaken';

interface StepManagerProps {
    currentStep: number;
    direction: number;
    formData: any;
    updateFormData: (data: object) => void;
}

const StepManager: React.FC<StepManagerProps> = ({ currentStep, direction, formData, updateFormData }) => {
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

export default StepManager;

