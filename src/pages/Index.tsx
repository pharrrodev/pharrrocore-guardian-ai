
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
  LogOut,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Index = () => {
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const modules = [
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
    },
    {
      title: "Assignment Instructions",
      description: "Access site-specific procedures and protocols",
      icon: Book,
      href: "/assignment-instructions",
      color: "bg-orange-500"
    },
    {
      title: "Training Dashboard",
      description: "Track training requirements and certifications",
      icon: Calendar,
      href: "/training-dashboard",
      color: "bg-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <Shield className="w-10 h-10 text-primary" />
              Security Management System
            </h1>
            <p className="text-muted-foreground">
              Comprehensive security operations platform
            </p>
            {profile && (
              <div className="flex items-center gap-2 mt-2">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  Welcome back, {profile.guard_name} ({profile.guard_id})
                </span>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <Link to={module.href}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${module.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {module.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {module.description}
                    </CardDescription>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today's Entries</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Incidents</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Visitors Today</span>
                  <span className="font-medium">-</span>
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
