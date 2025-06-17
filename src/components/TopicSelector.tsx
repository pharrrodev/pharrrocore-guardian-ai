
import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
// Removed: import { assignmentTopics, Topic } from "@/data/assignmentTopics";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase
import { toast } from "sonner"; // Import sonner
import React, { useState, useEffect } from "react"; // Import useEffect

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
        const { data, error } = await supabase
          .from('knowledge_base_topics')
          .select('id, label')
          .is('parent_id', null) // Fetch only top-level topics
          .order('sort_order')
          .order('label');

        if (error) throw error;
        setFetchedTopics(data || []);
      } catch (err: any) {
        console.error("Error fetching top-level topics:", err);
        toast.error("Failed to load topics.");
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
                {existingTopics.map((topic) => (
                  <CommandItem
                    key={topic.id}
                    value={topic.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === topic.value ? "opacity-100" : "opacity-0"
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
