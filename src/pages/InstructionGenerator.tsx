
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, FileText, Plus, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateInstructions } from "@/api/instruction-generate";
import { saveInstructions } from "@/api/instruction-save";
import { Topic } from "@/data/centralData";
import TopicSelector from "@/components/TopicSelector";

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
                Select an existing topic to update or create a new one, then paste your raw SOP text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TopicSelector 
                value={parentLabel}
                onChange={setParentLabel}
              />

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
                  {generatedTopics.map((topic, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{topic.label}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          ID: {topic.id}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <strong>Response:</strong> {topic.response}
                      </div>
                      
                      {topic.subTopics && topic.subTopics.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Subtopics ({topic.subTopics.length}):</h4>
                          <div className="space-y-2 pl-4 border-l-2 border-muted">
                            {topic.subTopics.map((subTopic, subIndex) => (
                              <div key={subIndex} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{subTopic.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {subTopic.id}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {subTopic.response}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

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
