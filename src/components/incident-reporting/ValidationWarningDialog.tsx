
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

interface ValidationWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  message: string;
}

const ValidationWarningDialog: React.FC<ValidationWarningDialogProps> = ({ open, onOpenChange, onConfirm, message }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50 mb-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <AlertDialogTitle className="text-center">Potential Mismatch Detected</AlertDialogTitle>
          <AlertDialogDescription className="text-center pt-2">
            Our AI assistant noticed a potential inconsistency between the selected incident type and your description:
            <p className="mt-2 font-semibold text-foreground italic">"{message}"</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center pt-4">
          <AlertDialogCancel>Go Back & Edit</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Submit Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ValidationWarningDialog;
