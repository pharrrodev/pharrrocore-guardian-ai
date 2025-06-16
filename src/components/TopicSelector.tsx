
import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { assignmentTopics, Topic } from "@/data/assignmentTopics";

interface TopicSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TopicSelector = ({ value, onChange }: TopicSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // Get all existing topic labels for the dropdown
  const existingTopics = assignmentTopics.map(topic => ({
    value: topic.label,
    label: topic.label,
    id: topic.id
  }));

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setShowCustomInput(true);
      setOpen(false);
      return;
    }
    
    onChange(selectedValue);
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
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
