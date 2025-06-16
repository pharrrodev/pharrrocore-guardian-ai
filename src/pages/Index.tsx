import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Bot, ClipboardList, ClipboardCheck, Clock, Radio, Calendar, Users, BarChart3, UserCheck, Settings } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tighter mb-2">Pharrrocore</h1>
        <p className="text-xl text-muted-foreground">Advanced AI Security Management</p>
      </header>
      <main className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl w-full">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <FileText className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">AI Incident Reporting</CardTitle>
                <CardDescription>Guided 7-step wizard to report incidents.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Use text, voice, or file uploads to create detailed, AI-enhanced incident reports compliant with UK security standards.
            </p>
            <Button asChild className="w-full">
              <Link to="/incident-reporting">Start New Report</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Bot className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">AI Assignment Instructions</CardTitle>
                <CardDescription>Interactive chatbot for site procedures.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Get instant, structured information about schedules, patrol routes, and safety manuals from our dedicated knowledge base.
            </p>
            <Button asChild className="w-full">
              <Link to="/assignment-instructions">Open Chatbot</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <ClipboardList className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Daily Occurrence Book</CardTitle>
                <CardDescription>Log all site activities and observations.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              A comprehensive digital log for security personnel to record events, patrols, and checks in a structured and consistent manner.
            </p>
            <Button asChild className="w-full">
              <Link to="/edob">Open EDOB</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <ClipboardCheck className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Uniform & Equipment Check</CardTitle>
                <CardDescription>Perform daily uniform and equipment inspection.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              A comprehensive checklist to ensure all security personnel are properly equipped with uniform and safety equipment before their shift.
            </p>
            <Button asChild className="w-full">
              <Link to="/uniform-check">Start Check</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Clock className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Break Time Checker</CardTitle>
                <CardDescription>Check when your next break is scheduled.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Instantly check if you're currently on break or find out when your next break starts using the shift rota data.
            </p>
            <Button asChild className="w-full">
              <Link to="/break-checker">Check Break Times</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Radio className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Radio & Handover Tracker</CardTitle>
                <CardDescription>Log radio tests and shift handovers.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Track completion of essential shift activities: radio functionality tests and handover briefings between guards.
            </p>
            <Button asChild className="w-full">
              <Link to="/radio-handover">Log Actions</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <UserCheck className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Visitor Access Log</CardTitle>
                <CardDescription>Record visitor check-in and check-out times.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Log all visitors entering and leaving the premises with photos and escort information for security tracking.
            </p>
            <Button asChild className="w-full">
              <Link to="/visitor-form">Log Visitor</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Calendar className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Rota Builder</CardTitle>
                <CardDescription>Create and manage shift schedules.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Supervisor tool to create, edit, and manage shift assignments for all security personnel with flexible scheduling options.
            </p>
            <Button asChild className="w-full">
              <Link to="/rota-builder">Manage Rota</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Shift Confirmation</CardTitle>
                <CardDescription>Confirm or decline assigned shifts.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Guards can view their assigned shifts and confirm availability or decline shifts they cannot work, helping maintain staffing levels.
            </p>
            <Button asChild className="w-full">
              <Link to="/shift-confirm">View My Shifts</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <BarChart3 className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Rota Dashboard</CardTitle>
                <CardDescription>Monitor shift confirmations and coverage.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Real-time overview of shift confirmations, pending responses, and staffing gaps to ensure adequate security coverage.
            </p>
            <Button asChild className="w-full">
              <Link to="/rota-dashboard">View Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Settings className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Instruction Generator</CardTitle>
                <CardDescription>Convert SOPs into chatbot topics.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Supervisor tool to convert raw standard operating procedure text into structured chatbot knowledge base topics using AI.
            </p>
            <Button asChild className="w-full">
              <Link to="/instruction-generator">Generate Instructions</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
