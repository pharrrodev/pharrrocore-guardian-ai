
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bot, ClipboardList, ClipboardCheck, Clock, Radio, Calendar, Users, BarChart3, UserCheck, Settings, GraduationCap, AlertTriangle, BookOpen, Mail, PenTool, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-background p-3 overflow-hidden">
      <header className="text-center mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tighter mb-1">Pharrrocore</h1>
        <p className="text-base text-muted-foreground">Advanced AI Security Management</p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="daily-ops" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-4 flex-shrink-0">
            <TabsTrigger value="daily-ops">Daily Operations</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="daily-ops" className="h-full overflow-auto">
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto">
                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Daily Occurrence Book</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Log all site activities and observations.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Digital log for security personnel to record events and patrols.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/edob">Open EDOB</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardCheck className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Uniform & Equipment Check</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Perform daily uniform and equipment inspection.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Comprehensive checklist to ensure proper equipment before shifts.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/uniform-check">Start Check</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Break Time Checker</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Check when your next break is scheduled.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Instantly check break times using shift rota data.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/break-checker">Check Breaks</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Radio & Handover Tracker</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Log radio tests and shift handovers.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Track radio functionality tests and handover briefings.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/radio-handover">Log Actions</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Visitor Access Log</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Record visitor check-in and check-out times.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Log all visitors with photos and escort information.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/visitor-form">Log Visitor</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Shift Confirmation</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Confirm or decline assigned shifts.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Guards can view and confirm availability for assigned shifts.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/shift-confirm">View My Shifts</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-tools" className="h-full overflow-auto">
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto">
                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">AI Incident Reporting</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Guided 7-step wizard to report incidents.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Use text, voice, or file uploads to create detailed, AI-enhanced incident reports.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/incident-reporting">Start Report</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">AI Assignment Instructions</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Interactive chatbot for site procedures.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Get instant information about schedules, patrol routes, and safety manuals.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/assignment-instructions">Open Chatbot</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <PenTool className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Tender Writer</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Generate professional tender documents with AI.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Create customized security tender proposals using AI assistance.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/tender-writer">Write Tender</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Email Formatter</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Convert shorthand to professional emails.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Transform quick notes into professional emails with proper formatting.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/email-formatter">Format Email</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Daily Security Summary</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Generate comprehensive daily reports.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Automatically compile daily activities into professional reports.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/daily-summary">View Summary</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Instruction Generator</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Convert SOPs into chatbot topics.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Convert SOPs into structured chatbot knowledge base topics.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/instruction-generator">Generate Instructions</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="management" className="h-full overflow-auto">
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto">
                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Rota Builder</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Create and manage shift schedules.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Supervisor tool to create and manage shift assignments.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/rota-builder">Manage Rota</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Rota Dashboard</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Monitor shift confirmations and coverage.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Real-time overview of shift confirmations and staffing gaps.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/rota-dashboard">View Dashboard</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Training Dashboard</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Track training records and certifications.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Monitor guard training records and certification expiry dates.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/training-dashboard">View Training</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">No-Show Dashboard</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Monitor guards who fail to check in.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Track and alert when guards don't check in for shifts.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/no-show-dashboard">View Alerts</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="h-full overflow-auto">
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto">
                <Card className="hover:shadow-lg transition-shadow duration-300 h-fit">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-6 h-6 text-primary" />
                      <CardTitle className="text-sm font-semibold">Admin Tools</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Manually trigger background scripts.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Administrator dashboard to run and monitor background scripts.
                    </p>
                    <Button asChild className="w-full" size="sm">
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
