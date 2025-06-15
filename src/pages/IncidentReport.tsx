
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const IncidentReport = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI Incident Reporting System</h1>
        <p className="text-xl text-muted-foreground mb-8">This is where the 7-step incident reporting wizard will be.</p>
        <Button asChild>
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default IncidentReport;
