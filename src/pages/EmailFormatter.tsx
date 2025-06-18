
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Copy, RefreshCw, Home } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { copyToClipboard } from '@/utils/clipboard';

const EmailFormatter = () => {
  const [rawText, setRawText] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [guardName, setGuardName] = useState('');
  const [formattedEmail, setFormattedEmail] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);

  const handleFormatEmail = async () => {
    if (!rawText.trim()) {
      toast.error('Please enter a message to format');
      return;
    }

    setIsFormatting(true);
    try {
      const response = await fetch('/api/email-format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText: rawText.trim(),
          recipientName: recipientName.trim() || 'Recipient',
          guardName: guardName.trim() || 'Security Guard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' })); // Try to parse error, fallback if not JSON
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const result = await response.json();
      setFormattedEmail(result.formatted);
      toast.success('Email formatted successfully!');
    } catch (error) {
      console.error('Error formatting email:', error);
      // Check if error is an instance of Error and has a message property
      const errorMessage = error instanceof Error ? error.message : 'Failed to format email';
      toast.error(errorMessage);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleCopyToClipboard = () => {
    copyToClipboard(formattedEmail);
    toast.success('Email copied to clipboard!');
  };

  const handleClear = () => {
    setRawText('');
    setFormattedEmail('');
    setRecipientName('');
    setGuardName('');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Formatter</h1>
            <p className="text-muted-foreground mt-2">
              Convert shorthand messages into professional emails
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button onClick={() => window.history.back()} variant="outline">
              ← Back
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Input Message
              </CardTitle>
              <CardDescription>
                Enter your shorthand message and email details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guardName">Your Name</Label>
                <Input
                  id="guardName"
                  value={guardName}
                  onChange={(e) => setGuardName(e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g., Site Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rawText">Your Message</Label>
                <Textarea
                  id="rawText"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g., cctv cam 2 frozen again, told site eng."
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleFormatEmail} 
                  disabled={isFormatting || !rawText.trim()}
                  className="flex-1"
                >
                  {isFormatting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Formatting...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Format Email
                    </>
                  )}
                </Button>
                <Button onClick={handleClear} variant="outline">
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Formatted Email
              </CardTitle>
              <CardDescription>
                Professional email ready to send
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formattedEmail">Professional Email</Label>
                <Textarea
                  id="formattedEmail"
                  value={formattedEmail}
                  readOnly
                  className="min-h-[200px] bg-muted/50"
                  placeholder="Your formatted email will appear here..."
                />
              </div>

              {formattedEmail && (
                <Button onClick={handleCopyToClipboard} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Include key details like locations, times, and actions taken</li>
              <li>• Mention any people involved or contacted</li>
              <li>• Add the recipient's name for a more personalized email</li>
              <li>• The AI will add proper greeting, professional language, and signature</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailFormatter;
