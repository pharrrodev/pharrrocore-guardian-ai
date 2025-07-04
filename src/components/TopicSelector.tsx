
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FetchedTopic {
  id: string; // Kebab-case ID from DB
  label: string;
}

interface TopicSelectorProps {
  value: string; // This will now store the selected topic ID (kebab-case) or custom label
  onChange: (value: string, isCustom: boolean, selectedTopic?: FetchedTopic) => void; // Pass ID or custom label, and if it's custom
  // Allow parent to know the selected topic object if needed
}

const TopicSelector = ({ value, onChange }: TopicSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [fetchedTopics, setFetchedTopics] = useState<FetchedTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  useEffect(() => {
    const fetchTopLevelTopics = async () => {
      setIsLoadingTopics(true);
      try {
        // Use direct query with type assertion since table isn't in types
        const { data, error } = await supabase
          .from('knowledge_base_topics' as any)
          .select('id, label')
          .is('parent_id', null)
          .order('sort_order')
          .order('label') as { data: FetchedTopic[] | null, error: any };

        if (error) throw error;
        setFetchedTopics(data || []);
      } catch (err) {
        console.error("Error fetching top-level topics:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching topics.";
        toast.error(`Failed to load topics: ${errorMessage}`);
        setFetchedTopics([]);
      } finally {
        setIsLoadingTopics(false);
      }
    };
    fetchTopLevelTopics();
  }, []);


  const handleSelect = (currentValue: string) => { // currentValue is topic.id or "custom"
    if (currentValue === "custom") {
      setShowCustomInput(true);
      setOpen(false);
      return;
    }
    
    const selectedTopic = fetchedTopics.find(t => t.id === currentValue);
    if (selectedTopic) {
      onChange(selectedTopic.id, false, selectedTopic); // Pass ID and topic object
    } else {
      // This case should ideally not happen if currentValue is from fetchedTopics
      onChange(currentValue, false);
    }
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      // When submitting a custom topic, we pass its label.
      // The parent (InstructionGenerator) will handle creating an ID for it.
      onChange(customValue.trim(), true);
      setShowCustomInput(false);
      setCustomValue("");
    }
  };

  const handleCustomCancel = () => {
    setShowCustomInput(false);
    setCustomValue("");
  };

  if (showCustomInput) {
    return (
      <div className="space-y-2">
        <label htmlFor="custom-topic" className="text-sm font-medium">
          Enter New Parent Topic Label
        </label>
        <div className="flex gap-2">
          <Input
            id="custom-topic"
            placeholder="e.g., New Safety Procedures"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
          />
          <Button 
            onClick={handleCustomSubmit} 
            disabled={!customValue.trim()}
            size="sm"
          >
            Add
          </Button>
          <Button 
            onClick={handleCustomCancel} 
            variant="outline" 
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Parent Topic Label
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value || "Select existing topic or create new..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search topics..." />
            <CommandList>
              <CommandEmpty>No topics found.</CommandEmpty>
              <CommandGroup heading="Existing Topics">
                {fetchedTopics.map((topic) => (
                  <CommandItem
                    key={topic.id}
                    value={topic.id} // Use topic.id for the value passed to onSelect
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === topic.id ? "opacity-100" : "opacity-0" // Compare with topic.id
                      )}
                    />
                    {topic.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  value="custom"
                  onSelect={handleSelect}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Topic
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TopicSelector;
