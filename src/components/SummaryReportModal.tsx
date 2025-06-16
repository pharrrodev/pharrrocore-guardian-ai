
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Save, Mail } from 'lucide-react';
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
    // Save functionality - could integrate with localStorage or a save API
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Security Summary Report
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleSave} variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleEmail} variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Report for {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Textarea
            value={summaryContent}
            readOnly
            className="h-full min-h-[500px] font-mono text-sm resize-none"
            placeholder="Summary content will appear here..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryReportModal;
