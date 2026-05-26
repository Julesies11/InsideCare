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
import { AlertCircle, UserX, LogOut, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
          <DialogTitle className="text-center text-xl">Deactivate Staff Member</DialogTitle>
          <DialogDescription className="text-center pt-2 text-base">
            Are you sure you want to set <strong>{staffName}</strong> to Inactive?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-sm">
            <Info className="size-5 shrink-0 mt-0.5 text-blue-600" />
            <div className="space-y-1">
              <p className="font-semibold">What does deactivation mean?</p>
              <p className="leading-relaxed opacity-90">
                Deactivating this staff member will remove them from active rosters, manager selection lists, and active staff views. 
                They will remain in the system for historical and compliance purposes.
              </p>
            </div>
          </div>

          {hasPortalAccess && (
            <Alert className="bg-slate-50 border-slate-200">
              <AlertCircle className="h-4 w-4 text-slate-600" />
              <AlertTitle className="text-slate-800 font-semibold text-sm">Portal Access Detected</AlertTitle>
              <AlertDescription className="text-slate-600 text-xs mt-1">
                This staff member has an active login. You can choose to revoke their access immediately, or keep it active for historical record viewing.
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
                className="w-full sm:w-auto"
              >
                <LogOut className="size-4 mr-2" />
                Revoke Access
              </Button>
            )}
            
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
              onClick={() => handleDeactivate(false)}
              disabled={isProcessing}
            >
              {hasPortalAccess ? 'Deactivate Only' : 'Deactivate Staff'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
