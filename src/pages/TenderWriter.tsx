import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Loader2, Home, Copy, FileDown } from "lucide-react"; // Added Copy, FileDown
import { useToast } from "@/hooks/use-toast"; // Assuming this should stay, not sonner for this file
import { DatePicker } from "@/components/ui/date-picker";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase
import { copyToClipboard } from "@/utils/clipboard"; // For copy functionality

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
  // Removed: const [downloadLink, setDownloadLink] = useState('');
  const [generatedTenderText, setGeneratedTenderText] = useState<string | null>(null);
  const [suggestedFileName, setSuggestedFileName] = useState<string | null>(null);
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
    // Removed: setDownloadLink('');
    setGeneratedTenderText(null); // Clear previous results
    setSuggestedFileName(null);

    try {
      const payload = {
        ...formData,
        mobilisationDate: formData.mobilisationDate
          ? formData.mobilisationDate.toISOString().split('T')[0]
          : '',
      };

      const { data: result, error: funcError } = await supabase.functions.invoke(
        'generate-tender-document',
        { body: payload }
      );

      if (funcError) {
        console.error('Edge function invocation error:', funcError);
        throw new Error(funcError.message || 'Failed to invoke tender generation service.');
      }
      
      if (result.error) { // Check for application-level error returned from function
        console.error('Error from Edge Function processing:', result.error);
        throw new Error(result.error);
      }

      if (result.generatedText && result.fileNameSuggestion) {
        setGeneratedTenderText(result.generatedText);
        setSuggestedFileName(result.fileNameSuggestion);
        toast({
          title: "Tender Draft Generated Successfully",
          description: "Review the generated text below. You can copy or download it.",
        });
      } else {
        throw new Error("Received incomplete data from tender generation service. Missing text or filename.");
      }

    } catch (error: any) { // Catch any error (string or Error object)
      console.error('Error generating tender:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate tender document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Compact Header with Home Button */}
      <header className="flex items-center justify-between p-4 border-b">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="shrink-0"
        >
          <Link to="/">
            <Home className="w-5 h-5" />
          </Link>
        </Button>
        
        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Tender Writer</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate professional security tender documents with AI assistance
          </p>
        </div>
        
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 p-4 overflow-hidden">
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

                {/* Old downloadLink button removed */}
              </div>
            </CardContent>
          </Card>

          {/* Display Generated Tender Text */}
          {generatedTenderText && (
            <Card className="max-w-4xl mx-auto mt-6">
              <CardHeader>
                <CardTitle>Generated Tender Draft</CardTitle>
                <CardDescription>Review the Markdown text below. You can copy it or download it as a .md file.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full border rounded-md p-3 bg-muted/30">
                  <pre className="text-sm whitespace-pre-wrap break-words">{generatedTenderText}</pre>
                </ScrollArea>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => {
                      copyToClipboard(generatedTenderText);
                      toast({ title: "Copied to clipboard!" });
                    }}
                    variant="outline"
                    className="flex-1 h-9"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button
                    onClick={() => {
                      const blob = new Blob([generatedTenderText], { type: 'text/markdown;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = suggestedFileName || 'tender_draft.md';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      toast({ title: "Markdown file download initiated."});
                    }}
                    variant="secondary"
                    className="flex-1 h-9"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Download as .md
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default TenderWriter;
