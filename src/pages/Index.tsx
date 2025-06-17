
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingUp, Users, AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-primary" />
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome to PharroCore Security Management System
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25+</div>
              <p className="text-xs text-muted-foreground">Available modules</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Operational</div>
              <p className="text-xs text-muted-foreground">All systems running</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">New Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">3</div>
              <p className="text-xs text-muted-foreground">Business sustainability modules</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Core Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Active</div>
              <p className="text-xs text-muted-foreground">Ready for use</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Guard Welfare Module</p>
                  <p className="text-sm text-muted-foreground">New business sustainability feature added</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Financial Tools Enhanced</p>
                  <p className="text-sm text-muted-foreground">Advanced cash flow management integrated</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Compliance Audit Suite</p>
                  <p className="text-sm text-muted-foreground">ACS compliance tracking system launched</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Navigate using the sidebar</h3>
                <p className="text-sm text-muted-foreground">
                  Use the sidebar on the left to access all modules organized by category. 
                  You can collapse or expand the sidebar using the toggle button.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Information
              </CardTitle>
              <CardDescription>Current system status and capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">Core Operations</div>
                  <p className="text-sm text-muted-foreground">EDOB, Incident Reporting, Visitor Management, Daily Summary</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">Staff Management</div>
                  <p className="text-sm text-muted-foreground">Scheduling, Training, Payroll, Compliance tracking</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">Business Tools</div>
                  <p className="text-sm text-muted-foreground">Financial management, Welfare monitoring, Audit compliance</p>
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
