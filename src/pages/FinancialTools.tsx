import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, DollarSign, TrendingUp, FileText, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Define proper types for our data
interface MockInvoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: string;
  daysOverdue: number;
}

const FinancialTools = () => {
  const [invoices, setInvoices] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [newInvoice, setNewInvoice] = useState({ client: "", amount: "", dueDate: "", description: "" });

  // Mock cash flow data
  const mockCashFlowData = [
    { date: "Week 1", balance: 45000, inflow: 25000, outflow: -18000 },
    { date: "Week 2", balance: 52000, inflow: 30000, outflow: -23000 },
    { date: "Week 3", balance: 49000, inflow: 20000, outflow: -23000 },
    { date: "Week 4", balance: 56000, inflow: 35000, outflow: -28000 },
    { date: "Week 5", balance: 53000, inflow: 25000, outflow: -28000 },
    { date: "Week 6", balance: 60000, inflow: 40000, outflow: -33000 },
  ];

  // Mock invoice data with proper typing
  const mockInvoices: MockInvoice[] = [
    { id: "INV-001", client: "SecureTech Ltd", amount: 15000, dueDate: "2024-01-20", status: "Sent", daysOverdue: 0 },
    { id: "INV-002", client: "Metro Shopping Centre", amount: 8500, dueDate: "2024-01-15", status: "Overdue", daysOverdue: 8 },
    { id: "INV-003", client: "City Hospital", amount: 22000, dueDate: "2024-01-25", status: "Draft", daysOverdue: 0 },
    { id: "INV-004", client: "Corporate Plaza", amount: 12000, dueDate: "2024-01-10", status: "Paid", daysOverdue: 0 },
    { id: "INV-005", client: "Industrial Estate", amount: 18500, dueDate: "2024-01-30", status: "Sent", daysOverdue: 0 },
  ];

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "Sent":
        return <Badge className="bg-blue-500">Sent</Badge>;
      case "Draft":
        return <Badge variant="outline">Draft</Badge>;
      case "Overdue":
        return <Badge variant="destructive">Overdue ({daysOverdue} days)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateInvoice = () => {
    if (!newInvoice.client || !newInvoice.amount || !newInvoice.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("Invoice created successfully!");
    setNewInvoice({ client: "", amount: "", dueDate: "", description: "" });
  };

  const handleInvoiceFinancing = (invoiceId: string, amount: number) => {
    toast.info(`Invoice financing integration coming soon. You could receive up to £${(amount * 0.9).toLocaleString()} within 24 hours.`);
  };

  const totalReceivables = mockInvoices.reduce((sum, inv) => inv.status !== "Paid" ? sum + inv.amount : sum, 0);
  const overdueAmount = mockInvoices.reduce((sum, inv) => inv.status === "Overdue" ? sum + inv.amount : sum, 0);
  const nextWeekPayroll = 28000; // Mock payroll calculation
  const projectedShortfall = nextWeekPayroll - (mockCashFlowData[0]?.balance || 0);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <DollarSign className="w-10 h-10 text-green-500" />
            Financial Tools & Cash Flow Management
          </h1>
          <p className="text-muted-foreground">
            Advanced financial management, cash flow forecasting, and invoice processing
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{totalReceivables.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Outstanding invoices</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Next 7 Days Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{nextWeekPayroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Upcoming payments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">£{overdueAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">£{mockCashFlowData[0]?.balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current balance</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cashflow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  90-Day Cash Flow Forecast
                </CardTitle>
                <CardDescription>Projected cash balance based on known inflows and outflows</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockCashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, "Amount"]} />
                    <Line type="monotone" dataKey="balance" stroke="#8884d8" strokeWidth={3} name="Cash Balance" />
                    <Line type="monotone" dataKey="inflow" stroke="#82ca9d" strokeWidth={2} name="Inflow" />
                    <Line type="monotone" dataKey="outflow" stroke="#ff7300" strokeWidth={2} name="Outflow" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Alerts</CardTitle>
                  <CardDescription>Important financial notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectedShortfall > 0 && (
                    <div className="flex items-center gap-2 p-3 border border-red-200 rounded-lg bg-red-50">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Projected Shortfall</p>
                        <p className="text-sm text-red-700">£{projectedShortfall.toLocaleString()} shortfall for next week's payroll</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">Overdue Invoices</p>
                      <p className="text-sm text-orange-700">£{overdueAmount.toLocaleString()} in overdue payments</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border border-green-200 rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Upcoming Payments</p>
                      <p className="text-sm text-green-700">£25,000 expected this week from clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Overview</CardTitle>
                  <CardDescription>Key financial metrics for this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: "Revenue", amount: 125000 },
                      { name: "Costs", amount: -95000 },
                      { name: "Profit", amount: 30000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`£${Math.abs(value).toLocaleString()}`, "Amount"]} />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Invoice Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Invoice</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>Generate a new invoice for your client</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client Name</Label>
                      <Input 
                        value={newInvoice.client}
                        onChange={(e) => setNewInvoice({...newInvoice, client: e.target.value})}
                        placeholder="Enter client name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (£)</Label>
                      <Input 
                        type="number"
                        value={newInvoice.amount}
                        onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input 
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input 
                        value={newInvoice.description}
                        onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                        placeholder="Security services for..."
                      />
                    </div>
                    <Button onClick={handleCreateInvoice} className="w-full">Create Invoice</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Invoice List</CardTitle>
                <CardDescription>Manage all your invoices and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">{invoice.client}</p>
                          </div>
                          <div>
                            <p className="font-medium">£{invoice.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Due: {invoice.dueDate}</p>
                          </div>
                          <div>
                            {getStatusBadge(invoice.status, invoice.daysOverdue)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {invoice.status === "Sent" || invoice.status === "Overdue" ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleInvoiceFinancing(invoice.id, invoice.amount)}
                          >
                            Get Paid Now
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Summary</CardTitle>
                  <CardDescription>Current payroll obligations and projections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>This Week's Payroll</span>
                    <span className="font-medium">£{nextWeekPayroll.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Week's Payroll</span>
                    <span className="font-medium">£29,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Total</span>
                    <span className="font-medium">£115,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Guards</span>
                    <span className="font-medium">47</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payroll vs Revenue</CardTitle>
                  <CardDescription>Weekly comparison of costs and income</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { week: "Week 1", payroll: 28000, revenue: 35000 },
                      { week: "Week 2", payroll: 29500, revenue: 38000 },
                      { week: "Week 3", payroll: 27000, revenue: 32000 },
                      { week: "Week 4", payroll: 30000, revenue: 40000 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, ""]} />
                      <Bar dataKey="payroll" fill="#ff7300" name="Payroll" />
                      <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Alerts</CardTitle>
                <CardDescription>Important payroll notifications and reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Payroll Due</p>
                      <p className="text-sm text-blue-700">Weekly payroll processing due in 2 days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 border border-green-200 rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Sufficient Funds</p>
                      <p className="text-sm text-green-700">Current balance covers next 2 payroll cycles</p>
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

export default FinancialTools;
