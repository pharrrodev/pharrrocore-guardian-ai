import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Home, ArrowLeft, RotateCcw, FileText, RefreshCw } from "lucide-react"; // Added RefreshCw
import { cn } from "@/lib/utils";
// Removed: import { centralData, type Topic } from "@/data/centralData";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase
import { toast } from "sonner"; // Import toast
import { ScrollArea } from "@/components/ui/scroll-area";

// Define Topic structure based on Supabase table and nesting requirement
export interface Topic {
  id: string;
  label: string;
  response: string;
  parent_id: string | null;
  sort_order?: number;
  subTopics?: Topic[]; // Client-side constructed hierarchy
}

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

// Helper function to build the topic tree
const buildTopicTree = (topics: Topic[], parentId: string | null = null): Topic[] => {
  return topics
    .filter(topic => topic.parent_id === parentId)
    .map(topic => ({
      ...topic,
      subTopics: buildTopicTree(topics, topic.id),
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.label.localeCompare(b.label));
};


const AssignmentInstructions = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I am your AI assistant for assignment instructions. Please select a topic below to get started." }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [allTopicsFlat, setAllTopicsFlat] = useState<Topic[]>([]); // Store flat list from DB
  const [currentTopics, setCurrentTopics] = useState<Topic[]>([]); // Hierarchical, for display
  const [history, setHistory] = useState<Topic[][]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [initialTopics, setInitialTopics] = useState<Topic[]>([]); // To store root of the tree

  const fetchTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_base_topics')
        .select('id, label, response, parent_id, sort_order')
        .order('parent_id', { nullsFirst: true }) // Important for tree building logic
        .order('sort_order')
        .order('label');

      if (error) throw error;

      setAllTopicsFlat(data || []);
      const topicTree = buildTopicTree(data || []);
      setInitialTopics(topicTree); // Store the root for reset
      setCurrentTopics(topicTree);
      setHistory([topicTree]);

    } catch (err: any) {
      console.error("Error fetching knowledge base topics:", err);
      toast.error("Failed to load instructions topics.");
      setCurrentTopics([]);
      setHistory([]);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const handleTopicSelect = (topic: Topic) => {
    const userMessage: Message = { sender: 'user', text: topic.label };
    setMessages(prev => [...prev, userMessage]);
    setIsAiTyping(true);

    setTimeout(() => {
        const aiResponse: Message = { sender: 'ai', text: topic.response };
        setMessages(prev => [...prev, aiResponse]);
        setIsAiTyping(false);
    
        if (topic.subTopics && topic.subTopics.length > 0) {
          setCurrentTopics(topic.subTopics);
          setHistory(prev => [...prev, topic.subTopics!]);
        }
    }, 1000);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevTopics = newHistory[newHistory.length - 1];
      setCurrentTopics(prevTopics);
      setHistory(newHistory);
    }
  };
  
  const handleStartOver = () => {
    setMessages([
      { sender: 'ai', text: "Hello! I am your AI assistant for assignment instructions. Please select a topic below to get started." }
    ]);
    setCurrentTopics(centralData.assignmentTopics);
    setHistory([centralData.assignmentTopics]);
  };

  const renderMessageText = (text: string) => {
    const phoneRegex = /(\d{3}-\d{3}-\d{4})/g;
    const parts = text.split(phoneRegex);

    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 1) { // Matched parts are at odd indices
            return (
              <a key={index} href={`tel:${part}`} className="text-blue-500 hover:underline">
                {part}
              </a>
            );
          }
          return part;
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
          <Bot className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">AI Assignment Instructions</CardTitle>
            <CardDescription>Get instant information about site procedures.</CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link to="/edob" aria-label="Go to EDOB">
                <FileText className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <Link to="/" aria-label="Go to dashboard">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-end gap-2',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'ai' && <Bot className="w-8 h-8 text-primary shrink-0 self-start" />}
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 max-w-[80%]',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{renderMessageText(message.text)}</p>
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <Bot className="w-8 h-8 text-primary shrink-0 self-start" />
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-2 pt-4 border-t">
           <div className="flex flex-wrap justify-center gap-2">
            {currentTopics.map((topic) => (
              <Button
                key={topic.id}
                variant="outline"
                size="sm"
                onClick={() => handleTopicSelect(topic)}
                disabled={isAiTyping}
              >
                {topic.label}
              </Button>
            ))}
          </div>
          {history.length > 1 && (
            <div className="flex items-center gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={handleBack} disabled={isAiTyping}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="ghost" size="sm" onClick={handleStartOver} disabled={isAiTyping}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssignmentInstructions;
