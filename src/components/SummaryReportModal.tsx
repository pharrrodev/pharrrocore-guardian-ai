
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Save, Mail, FileText, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';

interface SummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryContent: string;
  selectedDate: string;
}

const SummaryReportModal = ({ isOpen, onClose, summaryContent, selectedDate }: SummaryReportModalProps) => {
  const handleDownload = () => {
    const blob = new Blob([summaryContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-summary-${selectedDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded successfully!');
  };

  const handleSave = () => {
    localStorage.setItem(`summary-${selectedDate}`, summaryContent);
    toast.success('Summary saved successfully!');
  };

  const handleEmail = () => {
    const subject = `Security Summary Report - ${dayjs(selectedDate).format('MMMM D, YYYY')}`;
    const body = encodeURIComponent(summaryContent);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.open(mailtoLink);
    toast.success('Email client opened!');
  };

  const formatSummaryContent = (content: string) => {
    if (!content) return [];
    
    const lines = content.split('\n').filter(line => line.trim());
    const sections = [];
    let currentSection = { title: '', content: [] };
    
    lines.forEach(line => {
      // Check if line looks like a header (contains keywords or is all caps)
      const isHeader = line.includes(':') && (
        line.toLowerCase().includes('summary') ||
        line.toLowerCase().includes('incident') ||
        line.toLowerCase().includes('visitor') ||
        line.toLowerCase().includes('patrol') ||
        line.toLowerCase().includes('security') ||
        line.toLowerCase().includes('report') ||
        line.toLowerCase().includes('activity') ||
        line.toLowerCase().includes('shift') ||
        line.toLowerCase().includes('edob') ||
        line.toLowerCase().includes('occurrence') ||
        line.match(/^[A-Z\s:]+$/)
      );
      
      if (isHeader) {
        if (currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = { title: line.trim(), content: [] };
      } else {
        currentSection.content.push(line.trim());
      }
    });
    
    if (currentSection.title || currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const formattedSections = formatSummaryContent(summaryContent);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center justify-between text-2xl">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              Security Summary Report
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={handleSave} variant="outline" size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button onClick={handleEmail} variant="outline" size="sm" className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-lg">
            <Calendar className="w-4 h-4" />
            {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {formattedSections.length > 0 ? (
              formattedSections.map((section, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-4 border">
                  {section.title && (
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-primary">
                      <FileText className="w-4 h-4" />
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-2">
                    {section.content.map((line, lineIndex) => (
                      <p key={lineIndex} className="text-sm leading-relaxed text-foreground/90">
                        {line.startsWith('•') || line.startsWith('-') ? (
                          <span className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{line.replace(/^[•-]\s*/, '')}</span>
                          </span>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No summary content available</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryReportModal;
