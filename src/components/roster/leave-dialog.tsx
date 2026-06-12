import { useEffect, useRef, useState } from 'react';
import { rosterApi } from '@/api/roster.api';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { LEAVE_STATUS } from '@/config/enums';
import { getFilenameFromStorageUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface LeaveType {
  id: string;
  name: string;
}

interface ConflictingShift {
  id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  house?: { house_name: string } | null;
}

interface LeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveId?: string | null;
  onSuccess?: () => void;
  initialDate?: string;
  readOnly?: boolean;
}

export function LeaveDialog({
  open,
  onOpenChange,
  leaveId,
  onSuccess,
  initialDate,
  readOnly = false,
}: LeaveDialogProps) {
  const { user } = useAuth();
  const isEdit = !!leaveId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(initialDate || '');
  const [endDate, setEndDate] = useState(initialDate || '');
  const [reason, setReason] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Conflict detection
  const [conflictingShifts, setConflictingShifts] = useState<
    ConflictingShift[]
  >([]);

  useEffect(() => {
    if (open) {
      const fetchLeaveTypes = async () => {
        try {
          const data = await rosterApi.listLeaveTypes();
          setLeaveTypes(data);
        } catch (error) {
          console.error('Error fetching leave types:', error);
        }
      };
      fetchLeaveTypes();

      if (isEdit && leaveId) {
        const load = async () => {
          setLoading(true);
          try {
            const data = await rosterApi.getLeaveRequest(leaveId);
            if (!data) throw new Error('Leave request not found');
            setLeaveTypeId(data.leave_type_id || '');
            setStartDate(data.start_date || '');
            setEndDate(data.end_date || '');
            setReason(data.reason || '');
            setExistingAttachmentUrl(data.attachment_url || null);
          } catch (error) {
            console.error('Error loading leave request:', error);
            toast.error('Failed to load leave request');
          } finally {
            setLoading(false);
          }
        };
        load();
      } else {
        // Reset for new
        setLeaveTypeId('');
        setStartDate(initialDate || '');
        setEndDate(initialDate || '');
        setReason('');
        setAttachmentFile(null);
        setExistingAttachmentUrl(null);
        setLoading(false);
      }
    }
  }, [open, leaveId, isEdit, initialDate]);

  // Check for conflicting shifts when dates change
  useEffect(() => {
    if (!startDate || !endDate || !user?.staff_id || !open || readOnly) {
      setConflictingShifts([]);
      return;
    }

    const check = async () => {
      try {
        const data = await rosterApi.listConflictingShifts(
          user.staff_id!,
          startDate,
          endDate,
        );
        setConflictingShifts(data as ConflictingShift[]);
      } catch (error) {
        console.error('Error checking for conflicts:', error);
      }
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [startDate, endDate, user?.staff_id, open, readOnly]);

  const getFilenameFromUrl = getFilenameFromStorageUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!user?.staff_id) return;
    if (!leaveTypeId || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      let attachmentUrl = existingAttachmentUrl || undefined;
      if (attachmentFile) {
        const filePath = await rosterApi.uploadStaffDocument(
          user.staff_id,
          attachmentFile,
        );
        attachmentUrl = await rosterApi.getStaffDocumentSignedUrl(filePath);
      }

      const payload = {
        staff_id: user.staff_id,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        status: LEAVE_STATUS.PENDING,
        ...(attachmentUrl !== undefined
          ? { attachment_url: attachmentUrl }
          : {}),
      };

      await rosterApi.upsertLeaveRequest(payload, leaveId || undefined);

      toast.success(
        isEdit
          ? 'Leave request updated'
          : 'Leave request submitted successfully',
      );
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error(
        isEdit
          ? 'Failed to update leave request'
          : 'Failed to submit leave request',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Leave Request Details'
              : isEdit
                ? 'Edit Leave Request'
                : 'New Leave Request'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading details...</p>
          </div>
        ) : (
          <form
            id="leave-dialog-form"
            onSubmit={handleSubmit}
            className="space-y-5 py-4"
          >
            {/* Conflict warning */}
            {!readOnly && conflictingShifts.length > 0 && (
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 flex gap-3">
                <AlertTriangle className="size-4 text-warning mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-warning-800">
                    {conflictingShifts.length} rostered shift
                    {conflictingShifts.length !== 1 ? 's' : ''} overlap
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {conflictingShifts.map((s) => (
                      <Badge
                        key={s.id}
                        variant="warning"
                        appearance="light"
                        className="text-[10px] px-1 h-4"
                      >
                        {format(parseISO(s.start_date), 'dd MMM')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="leaveType">
                Leave Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={leaveTypeId}
                onValueChange={setLeaveTypeId}
                required
                disabled={readOnly}
              >
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason..."
                rows={3}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Attachment{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <div className="flex flex-col gap-2">
                {existingAttachmentUrl && !attachmentFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Paperclip className="size-3.5" />
                    <a
                      href={existingAttachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline truncate max-w-[200px]"
                      title={getFilenameFromUrl(existingAttachmentUrl)}
                    >
                      {getFilenameFromUrl(existingAttachmentUrl)}
                    </a>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setExistingAttachmentUrl(null)}
                        className="text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                )}
                {!readOnly &&
                  (attachmentFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="size-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">
                        {attachmentFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachmentFile(null)}
                        className="text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) =>
                          setAttachmentFile(e.target.files?.[0] ?? null)
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="size-3.5 me-1.5" />
                        {existingAttachmentUrl ? 'Replace' : 'Attach'}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button
              type="submit"
              form="leave-dialog-form"
              disabled={saving || loading}
            >
              {saving
                ? 'Saving...'
                : isEdit
                  ? 'Save Changes'
                  : 'Submit Request'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
