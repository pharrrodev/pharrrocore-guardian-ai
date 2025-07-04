
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, CheckSquare, FileText, Users, AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import React, { useMemo } from "react"; // Import useMemo

const ComplianceAudit = () => {
  const [acsProgress, setAcsProgress] = useState(0);
  const [subContractors, setSubContractors] = useState([]);
  const [auditTemplates, setAuditTemplates] = useState([]);
  const [newSubContractor, setNewSubContractor] = useState({ name: "", acsNumber: "", expiryDate: "" });

  // Mock ACS Requirements
  const acsRequirements = useMemo(() => [
    { id: 1, section: "1.1", title: "Management Structure", status: "Complete", evidence: "Org chart uploaded" },
    { id: 2, section: "1.2", title: "Operating Procedures", status: "In Progress", evidence: "Procedures documented" },
    { id: 3, section: "2.1", title: "Staff Vetting", status: "Complete", evidence: "Vetting policies uploaded" },
    { id: 4, section: "2.2", title: "Training Records", status: "Not Started", evidence: "" },
    { id: 5, section: "3.1", title: "Supervision Arrangements", status: "Complete", evidence: "Supervision schedules" },
    { id: 6, section: "3.2", title: "Customer Complaints", status: "In Progress", evidence: "Complaints procedure" },
    { id: 7, section: "4.1", title: "Insurance Requirements", status: "Complete", evidence: "Insurance certificates" },
    { id: 8, section: "4.2", title: "Health & Safety", status: "Not Started", evidence: "" },
  ], []);

  // Mock Sub-contractors
  const mockSubContractors = [
    { id: 1, name: "Elite Security Services", acsNumber: "ACS12345", expiryDate: "2024-06-15", status: "Approved" },
    { id: 2, name: "Guardian Protection Ltd", acsNumber: "ACS67890", expiryDate: "2024-02-10", status: "Expires Soon" },
    { id: 3, name: "SecureWatch Ltd", acsNumber: "ACS54321", expiryDate: "2023-12-20", status: "Expired" },
  ];

  // Mock Audit Templates
  const mockAuditTemplates = [
    { id: 1, name: "Quarterly Site Check", items: 15, lastUsed: "2024-01-10" },
    { id: 2, name: "Uniform Inspection", items: 8, lastUsed: "2024-01-12" },
    { id: 3, name: "Equipment Audit", items: 12, lastUsed: "2024-01-08" },
    { id: 4, name: "Training Compliance", items: 10, lastUsed: "2024-01-05" },
  ];

  useEffect(() => {
    // Calculate ACS progress
    const completedItems = acsRequirements.filter(req => req.status === "Complete").length;
    const progress = (completedItems / acsRequirements.length) * 100;
    setAcsProgress(progress);
  }, [acsRequirements]); // Added acsRequirements to dependency array

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Complete":
        return <Badge className="bg-green-500">Complete</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "Not Started":
        return <Badge variant="outline">Not Started</Badge>;
      case "Approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "Expires Soon":
        return <Badge className="bg-orange-500">Expires Soon</Badge>;
      case "Expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddSubContractor = () => {
    if (!newSubContractor.name || !newSubContractor.acsNumber || !newSubContractor.expiryDate) {
      toast.error("Please fill in all fields");
      return;
    }
    
    toast.success("Sub-contractor added successfully!");
    setNewSubContractor({ name: "", acsNumber: "", expiryDate: "" });
  };

  const handleCreateAuditTemplate = () => {
    toast.success("Audit template created successfully!");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <CheckSquare className="w-10 h-10 text-blue-500" />
              Compliance & Audit Suite
            </h1>
            <p className="text-muted-foreground">
              ACS compliance tracking, audit management, and sub-contractor vetting
            </p>
          </div>
          <Button asChild variant="ghost" size="icon">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">ACS Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{Math.round(acsProgress)}%</div>
                <Progress value={acsProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {acsRequirements.filter(req => req.status === "Complete").length} of {acsRequirements.length} complete
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sub-Contractors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSubContractors.length}</div>
              <p className="text-xs text-muted-foreground">
                {mockSubContractors.filter(sc => sc.status === "Approved").length} approved
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockSubContractors.filter(sc => sc.status === "Expires Soon" || sc.status === "Expired").length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Audit Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAuditTemplates.length}</div>
              <p className="text-xs text-muted-foreground">Available templates</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="acs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="acs">ACS Audit</TabsTrigger>
            <TabsTrigger value="audits">Internal Audits</TabsTrigger>
            <TabsTrigger value="subcontractors">Sub-Contractors</TabsTrigger>
          </TabsList>

          <TabsContent value="acs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  ACS Self-Assessment Progress
                </CardTitle>
                <CardDescription>
                  Track your progress through the Approved Contractor Scheme requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-medium">Overall Progress</span>
                    <span className="text-lg font-bold">{Math.round(acsProgress)}% Complete</span>
                  </div>
                  <Progress value={acsProgress} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ACS Requirements Checklist</CardTitle>
                <CardDescription>Complete each requirement with documentation and evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {acsRequirements.map((requirement) => (
                    <div key={requirement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <Checkbox 
                            checked={requirement.status === "Complete"}
                            className="data-[state=checked]:bg-green-500"
                          />
                          <div>
                            <p className="font-medium">{requirement.section} - {requirement.title}</p>
                            {requirement.evidence && (
                              <p className="text-sm text-muted-foreground">Evidence: {requirement.evidence}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(requirement.status)}
                        <Button variant="outline" size="sm">
                          {requirement.status === "Complete" ? "Update" : "Add Evidence"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ACS Submission Readiness</CardTitle>
                <CardDescription>Review your compliance status before submission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2 p-3 border border-green-200 rounded-lg bg-green-50">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Documentation</p>
                        <p className="text-sm text-green-700">{acsRequirements.filter(r => r.status === "Complete").length} sections completed</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 border border-orange-200 rounded-lg bg-orange-50">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">Pending</p>
                        <p className="text-sm text-orange-700">{acsRequirements.filter(r => r.status !== "Complete").length} sections remaining</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={acsProgress < 100}
                    onClick={() => toast.success("ACS assessment submitted for review")}
                  >
                    Submit ACS Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audits" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Internal Audit Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Audit Template</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Audit Template</DialogTitle>
                    <DialogDescription>Create a new audit checklist template</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input placeholder="e.g., Monthly Site Inspection" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Describe the purpose of this audit..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateAuditTemplate} className="w-full">Create Template</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {mockAuditTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {template.name}
                    </CardTitle>
                    <CardDescription>
                      {template.items} checklist items • Last used: {template.lastUsed}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Start Audit
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Results</CardTitle>
                <CardDescription>Completed audits and their scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Site A - Quarterly Check</p>
                      <p className="text-sm text-muted-foreground">Completed by John Smith • 2024-01-15</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">98% Pass</Badge>
                      <Button variant="ghost" size="sm">View Report</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Site B - Uniform Inspection</p>
                      <p className="text-sm text-muted-foreground">Completed by Sarah Jones • 2024-01-14</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500">85% Pass</Badge>
                      <Button variant="ghost" size="sm">View Report</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Site C - Equipment Audit</p>
                      <p className="text-sm text-muted-foreground">Completed by Mike Wilson • 2024-01-12</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">95% Pass</Badge>
                      <Button variant="ghost" size="sm">View Report</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subcontractors" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Sub-Contractor Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Add Sub-Contractor</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Sub-Contractor</DialogTitle>
                    <DialogDescription>Register a new sub-contracting company</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input 
                        value={newSubContractor.name}
                        onChange={(e) => setNewSubContractor({...newSubContractor, name: e.target.value})}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ACS Approval Number</Label>
                      <Input 
                        value={newSubContractor.acsNumber}
                        onChange={(e) => setNewSubContractor({...newSubContractor, acsNumber: e.target.value})}
                        placeholder="ACS12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ACS Expiry Date</Label>
                      <Input 
                        type="date"
                        value={newSubContractor.expiryDate}
                        onChange={(e) => setNewSubContractor({...newSubContractor, expiryDate: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleAddSubContractor} className="w-full">Add Sub-Contractor</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sub-Contractor Directory</CardTitle>
                <CardDescription>Manage ACS compliance for all sub-contracting partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSubContractors.map((contractor) => (
                    <div key={contractor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{contractor.name}</p>
                            <p className="text-sm text-muted-foreground">ACS: {contractor.acsNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Expires: {contractor.expiryDate}</p>
                            <p className="text-sm text-muted-foreground">
                              {contractor.status === "Expired" ? "Expired" : 
                               contractor.status === "Expires Soon" ? "Expires in 30 days" : "Valid"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contractor.status)}
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Alerts</CardTitle>
                <CardDescription>Important notifications about sub-contractor compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 border border-red-200 rounded-lg bg-red-50">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Expired ACS</p>
                      <p className="text-sm text-red-700">SecureWatch Ltd ACS approval has expired</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">Expiring Soon</p>
                      <p className="text-sm text-orange-700">Guardian Protection Ltd ACS expires in 23 days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border border-green-200 rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Compliance Up to Date</p>
                      <p className="text-sm text-green-700">Elite Security Services - All documentation current</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComplianceAudit;
