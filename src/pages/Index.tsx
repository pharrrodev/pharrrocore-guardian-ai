
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bot, ClipboardList, ClipboardCheck, Clock, Radio, Calendar, Users, BarChart3, UserCheck, Settings, GraduationCap, AlertTriangle, BookOpen, Mail, PenTool, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-background p-4 overflow-hidden">
      <header className="text-center mb-6 flex-shrink-0 relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter mb-2 text-gradient-primary">Pharrrocore</h1>
        <p className="text-lg text-muted-foreground">Advanced AI Security Management</p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="daily-ops" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-6 flex-shrink-0 guard-tabs">
            <TabsTrigger value="daily-ops" className="guard-tab text-base">Daily Operations</TabsTrigger>
            <TabsTrigger value="ai-tools" className="guard-tab text-base">AI Tools</TabsTrigger>
            <TabsTrigger value="management" className="guard-tab text-base">Management</TabsTrigger>
            <TabsTrigger value="admin" className="guard-tab text-base">Admin</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="daily-ops" className="h-full overflow-auto">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <ClipboardList className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Daily Occurrence Book</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Log all site activities and observations.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Digital log for security personnel to record events and patrols.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/edob">Open EDOB</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <ClipboardCheck className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Uniform & Equipment Check</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Perform daily uniform and equipment inspection.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Comprehensive checklist to ensure proper equipment before shifts.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/uniform-check">Start Check</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Break Time Checker</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Check when your next break is scheduled.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Instantly check break times and coverage using shift rota data and schedules.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/break-checker">Check Breaks</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Radio className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Radio & Handover Tracker</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Log radio tests and shift handovers.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Track radio functionality tests and handover briefings.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/radio-handover">Log Actions</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <UserCheck className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Visitor Access Log</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Record visitor check-in and check-out times.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Log all visitors with photos and escort information.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/visitor-form">Log Visitor</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Shift Confirmation</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Confirm or decline assigned shifts.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Guards can view and confirm availability for assigned shifts.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/shift-confirm">View My Shifts</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-tools" className="h-full overflow-auto">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">AI Incident Reporting</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Guided 7-step wizard to report incidents.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Use text, voice, or file uploads to create detailed, AI-enhanced incident reports.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/incident-reporting">Start Report</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Bot className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">AI Assignment Instructions</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Interactive chatbot for site procedures.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Get instant information about schedules, patrol routes, and safety manuals.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/assignment-instructions">Open Chatbot</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <PenTool className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Tender Writer</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Generate professional tender documents with AI.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Create customized security tender proposals using AI assistance.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/tender-writer">Write Tender</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Email Formatter</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Convert shorthand to professional emails.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Transform quick notes into professional emails with proper formatting.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/email-formatter">Format Email</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Daily Security Summary</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Generate comprehensive daily reports.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Automatically compile daily activities into professional reports.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/daily-summary">View Summary</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Settings className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Instruction Generator</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Convert SOPs into chatbot topics.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Convert SOPs into structured chatbot knowledge base topics.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/instruction-generator">Generate Instructions</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="management" className="h-full overflow-auto">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Rota Builder</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Create and manage shift schedules.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Supervisor tool to create and manage shift assignments.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/rota-builder">Manage Rota</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <BarChart3 className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Rota Dashboard</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Monitor shift confirmations and coverage.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Real-time overview of shift confirmations and staffing gaps.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/rota-dashboard">View Dashboard</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <GraduationCap className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Training Dashboard</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Track training records and certifications.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Monitor guard training records and certification expiry dates.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/training-dashboard">View Training</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">No-Show Dashboard</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Monitor guards who fail to check in.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Track and alert when guards don't check in for shifts.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/no-show-dashboard">View Alerts</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="h-full overflow-auto">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                <Card className="guard-card h-[240px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-8 h-8 text-primary" />
                      <CardTitle className="text-lg font-semibold">Admin Tools</CardTitle>
                    </div>
                    <CardDescription className="text-sm">Manually trigger background scripts.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col justify-between h-[132px]">
                    <p className="text-sm text-muted-foreground">
                      Administrator dashboard to run and monitor background scripts.
                    </p>
                    <Button asChild className="w-full guard-button" size="default">
                      <Link to="/admin-tools">Open Admin Tools</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
