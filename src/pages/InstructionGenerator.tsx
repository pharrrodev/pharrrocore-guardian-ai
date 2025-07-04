
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Home, FileText, Plus, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateInstructions } from "@/api/instruction-generate"; // This AI call is kept
// Removed: import { saveInstructions } from "@/api/instruction-save";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase
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
    const parentTopicLabel = selectedParentTopicInfo.label.trim();

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
      const requestBody = {
        rawText: rawText.trim(),
        parentTopicLabel: parentTopicLabel,
        parentTopicId: selectedParentTopicInfo.id // Pass existing parent ID if available
      };

      // Call the new Edge Function
      const { data: funcResponse, error: funcError } = await supabase.functions.invoke(
        'structure-sop-text',
        { body: requestBody }
      );

      if (funcError) throw funcError;

      if (funcResponse.status === 'ok' && funcResponse.topics) {
        let finalTopics = funcResponse.topics;

        // If a new parent topic was created (no selectedParentTopicInfo.id)
        // AND the AI didn't return this parent as the root of its structure,
        // we might need to wrap the AI's topics under this new parent.
        // However, the Edge Function is prompted to use parentTopicLabel as context
        // or make generated topics children of parentTopicId.
        // For this iteration, we'll trust the Edge Function's output structure.
        // The `save-knowledge-base-topics` function will handle parent_id for top-level items if needed.
        // If `parentTopicId` was supplied to structure-sop-text, topics should be structured under it.
        // If not, they are new top-level topics (or one root topic with subTopics).

        // If a new parent was created on the client (no selectedParentTopicInfo.id)
        // and the AI returns a flat list intended to be children of this new parent
        if (!selectedParentTopicInfo.id && currentParentId) { // currentParentId is the kebab-case of a new label
            const isParentPresent = finalTopics.some((t: Topic) => t.id === currentParentId);
            if (!isParentPresent && finalTopics.every((t: Topic) => t.id !== currentParentId)) {
                // AI did not create the parent, so we create it and nest AI topics under it
                const newParentNode: Topic = {
                    id: currentParentId,
                    label: parentTopicLabel,
                    response: `Main topic: ${parentTopicLabel}. Details are in sub-topics.`, // Placeholder response
                    parent_id: null, // This new topic is a root for these generated items
                    subTopics: finalTopics.map(t => ({...t, parent_id: currentParentId})) // Ensure children link to it
                };
                setGeneratedTopics([newParentNode]);
            } else {
                // AI might have created the parent, or it's already structured.
                // Ensure parent_id is set for topics that are children of the new parent.
                finalTopics = finalTopics.map((t: Topic) => {
                    if (t.id !== currentParentId && !t.parent_id) { // If not the parent itself and has no parent_id
                        return { ...t, parent_id: currentParentId };
                    }
                    return t;
                });
                setGeneratedTopics(finalTopics);
            }
        } else if (selectedParentTopicInfo.id) {
            // If generating for an existing parent, ensure returned topics have parent_id set
            finalTopics = finalTopics.map((t: Topic) => ({
                ...t,
                parent_id: t.parent_id || selectedParentTopicInfo.id // Default to selected parent if AI doesn't assign one
            }));
            setGeneratedTopics(finalTopics);
        } else {
            // Topics are new top-level items
            setGeneratedTopics(finalTopics.map(t => ({...t, parent_id: null})));
        }

        setShowPreview(true);
        toast.success(`Generated ${funcResponse.topics.length} topic(s) successfully for "${parentTopicLabel}"`);
      } else {
        toast.error(funcResponse.message || funcResponse.error || 'Failed to generate instructions via Edge Function');
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Generation failed: ${errorMessage}`);
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
        setSelectedParentTopicInfo({ id: null, label: "" }); // Corrected
        setGeneratedTopics([]);
        setShowPreview(false);
      } else {
        // Use saveData for error message if available, otherwise a generic message
        toast.error(saveData?.error || saveData?.message || 'Failed to save instructions');
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Save failed: ${errorMessage}`);
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
                value={selectedParentTopicInfo.label} // Corrected
                onChange={handleParentTopicChange} // Corrected
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
                disabled={isGenerating || !rawText.trim() || !selectedParentTopicInfo.label.trim()} // Corrected
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
