
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, FileText, Plus, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateInstructions } from "@/api/instruction-generate";
import { saveInstructions } from "@/api/instruction-save";
import { Topic } from "@/data/assignmentTopics";

const InstructionGenerator = () => {
  const [rawText, setRawText] = useState("");
  const [parentLabel, setParentLabel] = useState("");
  const [generatedTopics, setGeneratedTopics] = useState<Topic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!rawText.trim() || !parentLabel.trim()) {
      toast.error("Please provide both raw text and parent topic label");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateInstructions({
        rawText: rawText.trim(),
        parentLabel: parentLabel.trim(),
      });

      if (response.status === 'ok' && response.topics) {
        setGeneratedTopics(response.topics);
        setShowPreview(true);
        toast.success(`Generated ${response.topics.length} topics successfully`);
      } else {
        toast.error(response.message || 'Failed to generate instructions');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('An error occurred while generating instructions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (generatedTopics.length === 0) {
      toast.error("No topics to save");
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveInstructions({ topics: generatedTopics });

      if (response.status === 'ok') {
        toast.success(response.message || 'Instructions saved successfully');
        setRawText("");
        setParentLabel("");
        setGeneratedTopics([]);
        setShowPreview(false);
      } else {
        toast.error(response.message || 'Failed to save instructions');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving instructions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <FileText className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Assignment Instruction Generator</h1>
              <p className="text-muted-foreground">Convert raw SOP text into structured chatbot topics</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="icon">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Generate New Topics
              </CardTitle>
              <CardDescription>
                Paste your raw SOP text and specify a parent topic label
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="parent-label" className="text-sm font-medium mb-2 block">
                  Parent Topic Label
                </label>
                <Input
                  id="parent-label"
                  placeholder="e.g., Fire Safety Procedures"
                  value={parentLabel}
                  onChange={(e) => setParentLabel(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="raw-text" className="text-sm font-medium mb-2 block">
                  Raw SOP Text
                </label>
                <Textarea
                  id="raw-text"
                  placeholder="Paste your standard operating procedure text here..."
                  className="min-h-[300px]"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !rawText.trim() || !parentLabel.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Topics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generated Topics Preview
              </CardTitle>
              <CardDescription>
                Review the generated topics before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showPreview ? (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generated topics will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Generated Structure:</h3>
                    <pre className="text-sm overflow-auto max-h-[300px]">
                      {JSON.stringify(generatedTopics, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Topic Summary:</h4>
                    {generatedTopics.map((topic, index) => (
                      <div key={index} className="text-sm border-l-2 border-primary pl-3">
                        <div className="font-medium">{topic.label}</div>
                        <div className="text-muted-foreground">
                          ID: {topic.id} | {topic.subTopics?.length || 0} subtopics
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save to Assignment Topics
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InstructionGenerator;
