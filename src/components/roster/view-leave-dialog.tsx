import { useEffect, useState } from 'react';
import { rosterApi } from '@/api/roster.api';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  FileText,
  Info,
  Loader2,
  MessageSquare,
  Umbrella,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getFileIcon,
  getFilenameFromStorageUrl,
  toAbsoluteUrl,
} from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

interface ViewLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveId?: string | null;
}

const statusVariant: Record<
  string,
  'secondary' | 'success' | 'destructive' | 'warning'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function ViewLeaveDialog({
  open,
  onOpenChange,
  leaveId,
}: ViewLeaveDialogProps) {
  const [loading, setLoading] = useState(true);
  const [leave, setLeave] = useState<any>(null);

  useEffect(() => {
    if (open && leaveId) {
      const load = async () => {
        setLoading(true);
        try {
          const data = await rosterApi.getLeaveRequest(leaveId);
          setLeave(data);
        } catch (error) {
          console.error('Error loading leave request:', error);
          toast.error('Failed to load leave request');
          onOpenChange(false);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [open, leaveId, onOpenChange]);

  const handleViewFile = async (filePath: string) => {
    if (!filePath) return;
    try {
      const url = await rosterApi.getStaffDocumentSignedUrl(filePath);
      if (url) window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to open document');
    }
  };

  const fileName = leave?.attachment_url
    ? getFilenameFromStorageUrl(leave.attachment_url)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading details...
            </p>
          </div>
        ) : leave ? (
          <>
            {/* Immersive Header */}
            <div className="bg-amber-600 p-6 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Umbrella size={120} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-colors uppercase font-bold text-[10px] tracking-widest px-2 py-0.5"
                  >
                    Leave Request
                  </Badge>
                  <Badge
                    variant={statusVariant[leave.status] ?? 'secondary'}
                    className="uppercase font-bold text-[10px] tracking-widest px-2 py-0.5 shadow-sm"
                  >
                    {statusLabel[leave.status] ?? leave.status}
                  </Badge>
                </div>

                <DialogTitle className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">
                  {leave.leave_type?.leave_type_name || 'Leave Request'}
                </DialogTitle>

                <DialogDescription className="sr-only">
                  Leave request details from{' '}
                  {format(parseISO(leave.start_date), 'd MMM yyyy')} to{' '}
                  {format(parseISO(leave.end_date), 'd MMM yyyy')}
                </DialogDescription>

                <p className="text-white/80 font-medium flex items-center gap-1.5 text-sm sm:text-base">
                  <Calendar className="size-4" />
                  {format(parseISO(leave.start_date), 'EEEE, d MMMM yyyy')}
                  {leave.start_date !== leave.end_date && (
                    <>
                      {' '}
                      – {format(parseISO(leave.end_date), 'EEEE, d MMMM yyyy')}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-background">
              {/* Duration Info */}
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    Duration
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {Math.round(
                      (new Date(leave.end_date).getTime() -
                        new Date(leave.start_date).getTime()) /
                        86400000,
                    ) + 1}{' '}
                    day(s)
                  </p>
                </div>
              </div>

              {/* Reason */}
              {leave.reason && (
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                      Reason
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {leave.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Attachment Block */}
              {fileName && (
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <img
                      src={toAbsoluteUrl(
                        `/media/file-types/${getFileIcon(fileName)}`,
                      )}
                      className="size-5"
                      alt="file icon"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                      Attachment
                    </p>
                    <button
                      type="button"
                      className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline text-left line-clamp-1 mt-0.5 cursor-pointer"
                      onClick={() => handleViewFile(leave.attachment_url)}
                    >
                      {fileName}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Notes Block - Matching ViewShiftDialog style */}
              {leave.admin_notes && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Info size={40} className="text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="size-4 text-blue-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                      Feedback from Admin
                    </span>
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap italic">
                    "{leave.admin_notes}"
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Umbrella className="size-7 text-muted-foreground" />
            </div>
            <p className="text-gray-900 font-medium">No details found</p>
            <p className="text-sm text-gray-500 mt-1">
              The leave request data could not be retrieved.
            </p>
          </div>
        )}

        <DialogFooter className="p-4 bg-muted/30 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted font-bold"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
