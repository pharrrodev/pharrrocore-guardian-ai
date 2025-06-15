
import { format } from 'date-fns';
import { Shield, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface FinalReportProps {
  formData: any;
}

const FinalReport: React.FC<FinalReportProps> = ({ formData }) => {
  const reportId = `INC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const generatedDate = format(new Date(), 'dd/MM/yyyy');

  const generateNarrative = () => {
    const time = formData.incidentTime || 'a time';
    const date = formData.incidentDate ? format(formData.incidentDate, 'do MMMM yyyy') : 'a recent date';
    const location = formData.location ? `at ${formData.location}` : 'at an on-site location';
    const type = formData.incidentType ? `a ${formData.incidentType.toLowerCase()}` : 'an';
    const description = formData.description || 'No detailed description was provided.';

    return `At approximately ${time} hours on ${date}, this officer became aware of ${type} incident ${location}. ${description}`;
  };

  const generateActionsTaken = () => {
    if (formData.actionsTaken && formData.actionsTaken.length > 0) {
      return `The following actions were taken: ${formData.actionsTaken.join(', ')}.`;
    }
    return 'No specific immediate actions were logged in the system.';
  };

  return (
    <div className="w-full max-w-4xl p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader className="text-center items-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Security Incident Report</h1>
            <p className="text-muted-foreground">Innovatech Park Reading - Professional Documentation</p>
        </CardHeader>
        <CardContent>
          <div className="border-b pb-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="font-semibold">Date:</span> {formData.incidentDate ? format(formData.incidentDate, 'dd/MM/yyyy') : 'N/A'}</div>
            <div><span className="font-semibold">Time:</span> {formData.incidentTime || 'N/A'}</div>
            <div><span className="font-semibold">Location:</span> {formData.location || 'N/A'}</div>
            <div><span className="font-semibold">Type:</span> {formData.incidentType || 'N/A'}</div>
          </div>
          
          <div className="space-y-6 text-sm">
            <div>
              <h2 className="text-base font-semibold mb-2 text-primary">Incident Report</h2>
              <p className="text-muted-foreground leading-relaxed">{generateNarrative()}</p>
            </div>
            <div>
              <h2 className="text-base font-semibold mb-2 text-primary">Actions Taken</h2>
              <p className="text-muted-foreground leading-relaxed">{generateActionsTaken()}</p>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t text-xs text-muted-foreground flex justify-between">
            <span>Report ID: {reportId}</span>
            <span>Generated: {generatedDate}</span>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Link>
          </Button>
          <div className="flex gap-4">
            <Button variant="secondary">
              <Save className="mr-2 h-4 w-4" /> Save Draft
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Finalize Report
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FinalReport;
