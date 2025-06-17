
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  AlertTriangle, 
  Users, 
  Calendar,
  Shield,
  Book,
  Settings,
  BarChart3,
  Radio,
  UserCheck,
  Coffee,
  ClipboardCheck,
  Building,
  Clock,
  Mail,
  TrendingUp,
  Briefcase,
  DollarSign,
  Heart,
  CheckSquare
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const coreModules = [
    {
      title: "EDOB (Electronic Daily Occurrence Book)",
      description: "Log patrols, incidents, and daily observations",
      icon: FileText,
      href: "/edob",
      color: "bg-blue-500"
    },
    {
      title: "Incident Reporting",
      description: "Create detailed incident reports",
      icon: AlertTriangle,
      href: "/incident-reporting",
      color: "bg-red-500"
    },
    {
      title: "Visitor Management",
      description: "Log and track site visitors",
      icon: Users,
      href: "/visitor-form",
      color: "bg-green-500"
    },
    {
      title: "Daily Summary",
      description: "Generate comprehensive daily reports",
      icon: BarChart3,
      href: "/daily-summary",
      color: "bg-purple-500"
    }
  ];

  const operationalModules = [
    {
      title: "Assignment Instructions",
      description: "Access site-specific procedures and protocols",
      icon: Book,
      href: "/assignment-instructions",
      color: "bg-orange-500"
    },
    {
      title: "Uniform Check",
      description: "Conduct uniform and appearance inspections",
      icon: UserCheck,
      href: "/uniform-check",
      color: "bg-indigo-500"
    },
    {
      title: "Break Checker",
      description: "Monitor and schedule staff breaks",
      icon: Coffee,
      href: "/break-checker",
      color: "bg-amber-500"
    },
    {
      title: "Equipment Check",
      description: "Track equipment status and maintenance",
      icon: ClipboardCheck,
      href: "/equipment-check",
      color: "bg-cyan-500"
    }
  ];

  const communicationModules = [
    {
      title: "Radio Handover",
      description: "Manage radio equipment handovers",
      icon: Radio,
      href: "/radio-handover",
      color: "bg-pink-500"
    },
    {
      title: "Radio Handover Log",
      description: "View radio handover history",
      icon: Radio,
      href: "/radio-handover-log",
      color: "bg-rose-500"
    },
    {
      title: "Email Formatter",
      description: "Format and send professional emails",
      icon: Mail,
      href: "/email-formatter",
      color: "bg-teal-500"
    }
  ];

  const schedulingModules = [
    {
      title: "Rota Builder",
      description: "Create and manage staff schedules",
      icon: Calendar,
      href: "/rota-builder",
      color: "bg-violet-500"
    },
    {
      title: "Shift Confirm",
      description: "Confirm shift attendance and timings",
      icon: Clock,
      href: "/shift-confirm",
      color: "bg-emerald-500"
    },
    {
      title: "Rota Dashboard",
      description: "Overview of all scheduling activities",
      icon: Building,
      href: "/rota-dashboard",
      color: "bg-lime-500"
    },
    {
      title: "Training Dashboard",
      description: "Track training requirements and certifications",
      icon: Calendar,
      href: "/training-dashboard",
      color: "bg-sky-500"
    }
  ];

  const newModules = [
    {
      title: "Guard Welfare & Engagement",
      description: "Monitor guard satisfaction and provide support resources",
      icon: Heart,
      href: "/guard-welfare",
      color: "bg-red-600"
    },
    {
      title: "Financial Tools & Cash Flow",
      description: "Advanced financial management and invoice processing",
      icon: DollarSign,
      href: "/financial-tools",
      color: "bg-green-600"
    },
    {
      title: "Compliance & Audit Suite",
      description: "ACS compliance tracking and audit management",
      icon: CheckSquare,
      href: "/compliance-audit",
      color: "bg-blue-600"
    }
  ];

  const managementModules = [
    {
      title: "No Show Dashboard",
      description: "Track and manage staff attendance issues",
      icon: Users,
      href: "/no-show-dashboard",
      color: "bg-gray-500"
    },
    {
      title: "Payroll Variance",
      description: "Monitor payroll discrepancies and adjustments",
      icon: TrendingUp,
      href: "/payroll-variance",
      color: "bg-yellow-500"
    },
    {
      title: "Licence Dashboard",
      description: "Track SIA licenses and renewals",
      icon: Shield,
      href: "/licence-dashboard",
      color: "bg-red-600"
    },
    {
      title: "Tender Writer",
      description: "Generate professional tender documents",
      icon: Briefcase,
      href: "/tender-writer",
      color: "bg-slate-500"
    }
  ];

  const ModuleSection = ({ title, modules }: { title: string; modules: typeof coreModules }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-primary">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <Link to={module.href}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-sm group-hover:text-primary transition-colors">
                      {module.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <Shield className="w-10 h-10 text-primary" />
              PharroCore Security Management System
            </h1>
            <p className="text-muted-foreground">
              Comprehensive security operations platform for UK security companies
            </p>
          </div>
        </div>

        <ModuleSection title="🚀 New Business Sustainability Modules" modules={newModules} />
        <ModuleSection title="📋 Core Operations" modules={coreModules} />
        <ModuleSection title="⚙️ Daily Operations" modules={operationalModules} />
        <ModuleSection title="📡 Communication" modules={communicationModules} />
        <ModuleSection title="📅 Scheduling & Staff" modules={schedulingModules} />
        <ModuleSection title="📊 Management & Analytics" modules={managementModules} />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Administrative Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin-tools">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/reports-list">
                  <FileText className="w-4 h-4 mr-2" />
                  Reports Archive
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/visitor-log-today">
                  <Users className="w-4 h-4 mr-2" />
                  Today's Visitors
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/instruction-generator">
                  <Book className="w-4 h-4 mr-2" />
                  Instruction Generator
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Modules</span>
                  <span className="font-medium">25+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Core Operations</span>
                  <span className="font-medium">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">New Modules</span>
                  <span className="font-medium text-green-600">3 Added</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">System Status</span>
                  <span className="font-medium text-green-600">Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
