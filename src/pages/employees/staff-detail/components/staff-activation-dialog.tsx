import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, UserCheck, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StaffActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  email?: string;
  onConfirmActivate: (sendInvite: boolean) => Promise<void>;
}

export function StaffActivationDialog({
  open,
  onOpenChange,
  staffName,
  email,
  onConfirmActivate,
}: StaffActivationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActivate = async (sendInvite: boolean) => {
    try {
      setIsProcessing(true);
      await onConfirmActivate(sendInvite);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <UserCheck className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl">Activate Staff Member</DialogTitle>
          <DialogDescription className="text-center pt-2 text-base">
            Are you sure you want to set <strong>{staffName}</strong> to Active?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
            <Info className="size-5 shrink-0 mt-0.5 text-blue-600" />
            <div className="space-y-1">
              <p className="font-semibold">What does activation mean?</p>
              <p className="leading-relaxed opacity-90">
                Activating this staff member will make them available for scheduling on rosters, 
                visible in active staff lists, and available for selection as a manager.
              </p>
            </div>
          </div>

          {email && (
            <Alert className="bg-slate-50 border-slate-200">
              <Mail className="h-4 w-4 text-slate-600" />
              <AlertTitle className="text-slate-800 font-semibold text-sm">Portal Access Required</AlertTitle>
              <AlertDescription className="text-slate-600 text-xs mt-1">
                This staff member does not currently have portal access. You can send an invitation to <strong>{email}</strong> now, or activate them without login access.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:justify-between mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <div className="flex flex-col sm:flex-row gap-2">
            {email && (
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                onClick={() => handleActivate(true)}
                disabled={isProcessing}
              >
                <Mail className="size-4 mr-2" />
                Activate & Invite
              </Button>
            )}
            
            <Button
              type="button"
              variant={email ? "outline" : "default"}
              className={!email ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              onClick={() => handleActivate(false)}
              disabled={isProcessing}
            >
              {email ? 'Activate Only' : 'Activate Staff'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
