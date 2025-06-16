
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { ScrollArea } from "@/components/ui/scroll-area";

const TenderWriter = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    siteAddress: '',
    guardingHoursPerWeek: '',
    keyRisks: '',
    mobilisationDate: undefined as Date | undefined,
    siteSpecifics: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      mobilisationDate: date
    }));
  };

  const handleGenerateTender = async () => {
    // Validate required fields
    if (!formData.clientName || !formData.siteAddress || !formData.guardingHoursPerWeek) {
      toast({
        title: "Missing Information",
        description: "Please fill in client name, site address, and guarding hours per week.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setDownloadLink('');

    try {
      const response = await fetch('/api/tender-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mobilisationDate: formData.mobilisationDate?.toISOString().split('T')[0] || ''
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tender');
      }

      const result = await response.json();
      setDownloadLink(result.downloadLink);
      
      toast({
        title: "Tender Generated Successfully",
        description: "Your tender document is ready for download.",
      });
    } catch (error) {
      console.error('Error generating tender:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate tender document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-12 h-12 text-primary" />
              <h1 className="text-4xl font-bold">Tender Writer</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Generate professional security tender documents with AI assistance
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Tender Information</CardTitle>
              <CardDescription>
                Fill in the details below to generate a customized tender document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Enter client name"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guardingHours">Guarding Hours Per Week *</Label>
                  <Input
                    id="guardingHours"
                    type="number"
                    placeholder="e.g., 168"
                    value={formData.guardingHoursPerWeek}
                    onChange={(e) => handleInputChange('guardingHoursPerWeek', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteAddress">Site Address *</Label>
                <Input
                  id="siteAddress"
                  placeholder="Enter full site address"
                  value={formData.siteAddress}
                  onChange={(e) => handleInputChange('siteAddress', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Mobilisation Date</Label>
                <DatePicker
                  value={formData.mobilisationDate}
                  onChange={handleDateChange}
                  placeholder="Select mobilisation date"
                  allowFuture={true}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyRisks">Key Risks</Label>
                <Textarea
                  id="keyRisks"
                  placeholder="Describe key security risks for this site (e.g., theft, vandalism, unauthorized access)"
                  value={formData.keyRisks}
                  onChange={(e) => handleInputChange('keyRisks', e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteSpecifics">Site Specifics / Extra Info</Label>
                <Textarea
                  id="siteSpecifics"
                  placeholder="Any additional site-specific information, special requirements, or extra details to include in the tender"
                  value={formData.siteSpecifics}
                  onChange={(e) => handleInputChange('siteSpecifics', e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGenerateTender}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Tender...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Draft
                    </>
                  )}
                </Button>

                {downloadLink && (
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1"
                  >
                    <a href={downloadLink} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Tender
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TenderWriter;
