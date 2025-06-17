
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, FileText, Plus, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateInstructions } from "@/api/instruction-generate"; // This AI call is kept
// Removed: import { saveInstructions } from "@/api/instruction-save";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase
// Assuming Topic interface from centralData is compatible or will be adjusted.
// For now, the Edge Function expects { id, label, response, parent_id?, sort_order?, subTopics? }
// Let's define a local Topic type that matches this expectation for clarity.
interface Topic {
  id: string;
  label: string;
  response: string;
  parent_id?: string | null;
  sort_order?: number;
  subTopics?: Topic[];
}
interface FetchedTopic { // From TopicSelector
  id: string;
  label: string;
}

import TopicSelector from "@/components/TopicSelector";
import { kebabCase } from 'lodash'; // For generating kebab-case IDs

const InstructionGenerator = () => {
  const [rawText, setRawText] = useState("");
  // Store parent topic info: id (if existing) and label (for display and for new parent)
  const [selectedParentTopicInfo, setSelectedParentTopicInfo] = useState<{ id: string | null; label: string }>({ id: null, label: "" });

  const [generatedTopics, setGeneratedTopics] = useState<Topic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleParentTopicChange = (value: string, isCustom: boolean, selectedTopic?: FetchedTopic) => {
    if (isCustom) {
      setSelectedParentTopicInfo({ id: null, label: value }); // Custom topic, ID will be generated if it becomes a parent
    } else if (selectedTopic) {
      setSelectedParentTopicInfo({ id: selectedTopic.id, label: selectedTopic.label });
    } else { // Clearing selection
      setSelectedParentTopicInfo({id: null, label: ""});
    }
  };

  const handleGenerate = async () => {
    if (!rawText.trim() || !selectedParentTopicInfo.label.trim()) {
      toast.error("Please provide both raw text and a parent topic label/selection.");
      return;
    }

    setIsGenerating(true);
    let currentParentId = selectedParentTopicInfo.id;
    let parentTopicLabel = selectedParentTopicInfo.label.trim();

    // If it's a new parent topic (no ID yet), generate one.
    // This new parent itself won't have a response from this UI,
    // it acts as a container for AI generated sub-topics.
    // The AI might generate a response for it, or it's just a structural node.
    if (!currentParentId && parentTopicLabel) {
      currentParentId = kebabCase(parentTopicLabel);
      // Potentially add this new parent to generatedTopics if it needs to be saved itself
      // For now, generateInstructions API is expected to handle the parent context.
    }

    try {
      // generateInstructions might need parentId as well as parentLabel for context
      const response = await generateInstructions({
        rawText: rawText.trim(),
        parentLabel: parentTopicLabel, // Pass the label
        // parentId: currentParentId, // Pass ID if API supports it for context
      });

      if (response.status === 'ok' && response.topics) {
        // Ensure generated topics have parent_id set if currentParentId exists
        // and they are meant to be children of the selected/created parent.
        // This logic depends on how generateInstructions API structures its output.
        // For now, assume it returns topics potentially needing parent_id linkage.
        const processedTopics = response.topics.map(topic => ({
          ...topic,
          // If the AI doesn't set parent_id for sub-topics relative to parentLabel, set it here.
          // This assumes topics from AI are direct children of parentLabel.
          // If AI creates deeper hierarchies, its own parent_id should be respected.
          parent_id: topic.parent_id || currentParentId || null,
        }));

        // If a new parent topic was created by typing, and AI didn't return it, add it.
        if (!selectedParentTopicInfo.id && parentTopicLabel && currentParentId) {
            const newParentTopicExists = processedTopics.some(t => t.id === currentParentId);
            if (!newParentTopicExists) {
                const newParentTopic: Topic = {
                    id: currentParentId,
                    label: parentTopicLabel,
                    response: "Parent topic for AI generated content.", // Default response
                    parent_id: null, // Top-level
                    subTopics: processedTopics, // Nest generated topics under it
                };
                setGeneratedTopics([newParentTopic]);
            } else {
                 // If AI returned the parent, ensure subtopics are nested correctly if not already
                 setGeneratedTopics(processedTopics.map(t => t.id === currentParentId ? {...t, subTopics: t.subTopics || processedTopics.filter(st => st.parent_id === currentParentId)} : t ));
            }
        } else {
            setGeneratedTopics(processedTopics);
        }

        setShowPreview(true);
        toast.success(`Generated ${response.topics.length} topics successfully for ${parentTopicLabel}`);
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
      // Call the Edge Function
      const { data: saveData, error: saveError } = await supabase.functions.invoke(
        'save-knowledge-base-topics',
        { body: { topics: generatedTopics } }
      );

      if (saveError) throw saveError;

      if (saveData && !saveData.error) { // Check for application-level error from function
        toast.success(saveData.message || 'Instructions saved successfully');
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
