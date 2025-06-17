
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, Heart, Award, Users, TrendingUp, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const GuardWelfare = () => {
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [kudosData, setKudosData] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [kudosForm, setKudosForm] = useState({ guardName: "", reason: "", category: "" });

  // Mock data for demonstration
  const mockSurveyData = [
    { week: "Week 1", satisfaction: 4.2, equipment: 90, morale: 3.8 },
    { week: "Week 2", satisfaction: 4.1, equipment: 85, morale: 3.9 },
    { week: "Week 3", satisfaction: 4.5, equipment: 95, morale: 4.2 },
    { week: "Week 4", satisfaction: 4.3, equipment: 88, morale: 4.0 },
  ];

  const mockKudosData = [
    { id: 1, guard: "John Smith", reason: "Excellent observation skills", giver: "Supervisor Mike", date: "2024-01-15", category: "Good Catch" },
    { id: 2, guard: "Sarah Jones", reason: "Helped with emergency response", giver: "Manager Lisa", date: "2024-01-14", category: "Team Player" },
    { id: 3, guard: "David Wilson", reason: "Perfect attendance this month", giver: "Admin Team", date: "2024-01-13", category: "Above & Beyond" },
  ];

  const wellnessResources = [
    {
      category: "Mental Health Support",
      resources: [
        { name: "Mind", description: "Mental health charity", link: "https://www.mind.org.uk", phone: "0300 123 3393" },
        { name: "Samaritans", description: "24/7 emotional support", link: "https://www.samaritans.org", phone: "116 123" },
        { name: "NHS Mental Health", description: "NHS mental health services", link: "https://www.nhs.uk/mental-health", phone: "111" },
      ]
    },
    {
      category: "Financial Wellbeing",
      resources: [
        { name: "MoneyHelper", description: "Free financial guidance", link: "https://www.moneyhelper.org.uk", phone: "0800 011 3797" },
        { name: "StepChange", description: "Debt advice charity", link: "https://www.stepchange.org", phone: "0800 138 1111" },
        { name: "Citizens Advice", description: "Free advice service", link: "https://www.citizensadvice.org.uk", phone: "0800 144 8848" },
      ]
    },
    {
      category: "PharroCore Support",
      resources: [
        { name: "HR Support", description: "Internal HR assistance", link: "mailto:hr@pharrocore.com", phone: "0800 123 4567" },
        { name: "Technical Support", description: "App and system help", link: "mailto:support@pharrocore.com", phone: "0800 123 4568" },
        { name: "Emergency Line", description: "24/7 emergency support", link: "tel:08001234569", phone: "0800 123 4569" },
      ]
    }
  ];

  const handleSurveySubmit = () => {
    toast.success("Survey response submitted anonymously");
    setActiveSurvey(null);
  };

  const handleKudosSubmit = () => {
    if (!kudosForm.guardName || !kudosForm.reason || !kudosForm.category) {
      toast.error("Please fill in all fields");
      return;
    }
    
    toast.success("Kudos awarded successfully!");
    setKudosForm({ guardName: "", reason: "", category: "" });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <Heart className="w-10 h-10 text-red-500" />
              Guard Welfare & Engagement
            </h1>
            <p className="text-muted-foreground">
              Supporting guard wellbeing and reducing turnover through engagement and support
            </p>
          </div>
          <Button asChild variant="ghost" size="icon">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="pulse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pulse">Pulse Surveys</TabsTrigger>
            <TabsTrigger value="kudos">Recognition</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">Wellness Hub</TabsTrigger>
          </TabsList>

          <TabsContent value="pulse" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Weekly Pulse Survey
                  </CardTitle>
                  <CardDescription>Quick anonymous feedback - takes less than 30 seconds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>How was your week overall? (1-5)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Poor</SelectItem>
                        <SelectItem value="2">2 - Poor</SelectItem>
                        <SelectItem value="3">3 - Average</SelectItem>
                        <SelectItem value="4">4 - Good</SelectItem>
                        <SelectItem value="5">5 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Do you have all the equipment you need?</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Yes/No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional comments (optional)</Label>
                    <Textarea placeholder="Any additional feedback..." />
                  </div>

                  <Button onClick={handleSurveySubmit} className="w-full">
                    Submit Survey (Anonymous)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Survey Results Overview</CardTitle>
                  <CardDescription>Aggregated anonymous responses from this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Response Rate</span>
                      <Badge variant="outline">78% (23/30 guards)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Satisfaction</span>
                      <Badge className="bg-green-500">4.2/5</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Equipment Issues</span>
                      <Badge variant="destructive">12% report issues</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Morale Trend</span>
                      <Badge className="bg-blue-500">↗ Improving</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kudos" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Give Kudos
                  </CardTitle>
                  <CardDescription>Recognize exceptional performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Guard Name</Label>
                    <Input 
                      value={kudosForm.guardName}
                      onChange={(e) => setKudosForm({...kudosForm, guardName: e.target.value})}
                      placeholder="Enter guard name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={kudosForm.category} onValueChange={(value) => setKudosForm({...kudosForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good-catch">Good Catch</SelectItem>
                        <SelectItem value="team-player">Team Player</SelectItem>
                        <SelectItem value="above-beyond">Above & Beyond</SelectItem>
                        <SelectItem value="customer-service">Customer Service</SelectItem>
                        <SelectItem value="safety">Safety Excellence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea 
                      value={kudosForm.reason}
                      onChange={(e) => setKudosForm({...kudosForm, reason: e.target.value})}
                      placeholder="Describe what they did well..."
                    />
                  </div>

                  <Button onClick={handleKudosSubmit} className="w-full">
                    <Award className="w-4 h-4 mr-2" />
                    Award Kudos
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Kudos</CardTitle>
                  <CardDescription>Latest recognition awards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockKudosData.map((kudos) => (
                      <div key={kudos.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{kudos.guard}</span>
                          <Badge variant="outline">{kudos.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{kudos.reason}</p>
                        <div className="text-xs text-muted-foreground">
                          By {kudos.giver} • {kudos.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Trends</CardTitle>
                  <CardDescription>Weekly satisfaction scores over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockSurveyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[1, 5]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="satisfaction" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="morale" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipment Satisfaction</CardTitle>
                  <CardDescription>Percentage reporting adequate equipment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockSurveyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="equipment" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Monthly welfare and engagement statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">23%</div>
                    <div className="text-sm text-muted-foreground">Turnover Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">4.2/5</div>
                    <div className="text-sm text-muted-foreground">Avg Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-muted-foreground">Kudos Awarded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">78%</div>
                    <div className="text-sm text-muted-foreground">Survey Response</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="space-y-6">
              {wellnessResources.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {category.resources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">{resource.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                          <div className="space-y-2">
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <a href={resource.link} target="_blank" rel="noopener noreferrer">
                                Visit Website
                              </a>
                            </Button>
                            <div className="text-center">
                              <span className="text-sm font-medium">Phone: {resource.phone}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GuardWelfare;
