import { useState } from 'react';
import { AlertCircle, Info, LogOut, UserX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StaffDeactivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  hasPortalAccess: boolean;
  onConfirmDeactivate: (revokeAccess: boolean) => Promise<void>;
}

export function StaffDeactivationDialog({
  open,
  onOpenChange,
  staffName,
  hasPortalAccess,
  onConfirmDeactivate,
}: StaffDeactivationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeactivate = async (revokeAccess: boolean) => {
    try {
      setIsProcessing(true);
      await onConfirmDeactivate(revokeAccess);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
            <UserX className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Deactivate Staff Member
          </DialogTitle>
          <DialogDescription className="text-center pt-2 text-base">
            Are you sure you want to set <strong>{staffName}</strong> to
            Inactive?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
            <Info className="size-5 shrink-0 mt-0.5 text-blue-600" />
            <div className="space-y-1">
              <p className="font-semibold">What does deactivation mean?</p>
              <p className="leading-relaxed opacity-90">
                Deactivating this staff member will remove them from active
                rosters, manager selection lists, and active staff views. They
                will remain in the system for historical and compliance
                purposes.
              </p>
            </div>
          </div>

          {hasPortalAccess && (
            <Alert className="bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-200 font-semibold text-sm">
                1-Click Deactivation & Web Login Disabling
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs mt-1">
                Deactivating <strong>{staffName}</strong> will set their employment status to Inactive and automatically disable their web portal login credentials.
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
            {hasPortalAccess && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDeactivate(true)}
                disabled={isProcessing}
                className="w-full sm:w-auto font-medium"
                autoFocus
              >
                <LogOut className="size-4 mr-2" />
                Deactivate & Disable Login
              </Button>
            )}

            <Button
              type="button"
              variant={hasPortalAccess ? 'outline' : 'destructive'}
              className={
                !hasPortalAccess ? 'bg-amber-600 hover:bg-amber-700 text-white font-medium' : ''
              }
              onClick={() => handleDeactivate(false)}
              disabled={isProcessing}
            >
              {hasPortalAccess ? 'Deactivate Without Disabling Login' : 'Deactivate Staff'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
