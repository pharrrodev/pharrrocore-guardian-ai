
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignmentTopics, Topic } from "@/data/assignmentTopics";

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

const AssignmentInstructions = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I am your AI assistant for assignment instructions. Please select a topic below to get started." }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentTopics, setCurrentTopics] = useState<Topic[]>(assignmentTopics);
  const [history, setHistory] = useState<Topic[][]>([assignmentTopics]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTopicSelect = (topic: Topic) => {
    const userMessage: Message = { sender: 'user', text: topic.label };
    const aiResponse: Message = { sender: 'ai', text: topic.response };

    setMessages(prev => [...prev, userMessage, aiResponse]);

    if (topic.subTopics && topic.subTopics.length > 0) {
      setCurrentTopics(topic.subTopics);
      setHistory(prev => [...prev, topic.subTopics!]);
    }
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
          <Bot className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">AI Assignment Instructions</CardTitle>
            <CardDescription>Get instant information about site procedures.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="icon" className="ml-auto">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
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
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-4 pt-4 border-t">
           <div className="flex flex-wrap justify-center gap-2">
            {currentTopics.map((topic) => (
              <Button
                key={topic.id}
                variant="outline"
                size="sm"
                onClick={() => handleTopicSelect(topic)}
              >
                {topic.label}
              </Button>
            ))}
          </div>
          {history.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to previous topics
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssignmentInstructions;
