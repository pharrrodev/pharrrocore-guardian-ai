
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";

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
    <div className="h-screen flex flex-col">
      {/* Compact Header */}
      <header className="text-center py-4 border-b">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Tender Writer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate professional security tender documents with AI assistance
        </p>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tender Information</CardTitle>
              <CardDescription className="text-sm">
                Fill in the details below to generate a customized tender document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="clientName" className="text-sm">Client Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Enter client name"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="guardingHours" className="text-sm">Guarding Hours Per Week *</Label>
                  <Input
                    id="guardingHours"
                    type="number"
                    placeholder="e.g., 168"
                    value={formData.guardingHoursPerWeek}
                    onChange={(e) => handleInputChange('guardingHoursPerWeek', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="siteAddress" className="text-sm">Site Address *</Label>
                <Input
                  id="siteAddress"
                  placeholder="Enter full site address"
                  value={formData.siteAddress}
                  onChange={(e) => handleInputChange('siteAddress', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm">Mobilisation Date</Label>
                <DatePicker
                  value={formData.mobilisationDate}
                  onChange={handleDateChange}
                  placeholder="Select mobilisation date"
                  allowFuture={true}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="keyRisks" className="text-sm">Key Risks</Label>
                <Textarea
                  id="keyRisks"
                  placeholder="Describe key security risks for this site (e.g., theft, vandalism, unauthorized access)"
                  value={formData.keyRisks}
                  onChange={(e) => handleInputChange('keyRisks', e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="siteSpecifics" className="text-sm">Site Specifics / Extra Info</Label>
                <Textarea
                  id="siteSpecifics"
                  placeholder="Any additional site-specific information, special requirements, or extra details to include in the tender"
                  value={formData.siteSpecifics}
                  onChange={(e) => handleInputChange('siteSpecifics', e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleGenerateTender}
                  disabled={isGenerating}
                  className="flex-1 h-9"
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
                    className="flex-1 h-9"
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
        </ScrollArea>
      </div>
    </div>
  );
};

export default TenderWriter;
