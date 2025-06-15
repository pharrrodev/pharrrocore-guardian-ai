
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, Home } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

const AssignmentInstructions = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I am your AI assistant for assignment instructions. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = { sender: 'ai', text: `This is a placeholder response for: "${input}". The AI is not connected yet.` };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInput('');
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
        <CardFooter>
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssignmentInstructions;
