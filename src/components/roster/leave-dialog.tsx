import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TABLES } from '@/config/db-tables';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { LEAVE_STATUS } from '@/config/enums';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Paperclip, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { getFilenameFromStorageUrl } from '@/lib/helpers';

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
}

export function LeaveDialog({ open, onOpenChange, leaveId, onSuccess, initialDate }: LeaveDialogProps) {
  const { user } = useAuth();
  const isEdit = !!leaveId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(initialDate || '');
  const [endDate, setEndDate] = useState(initialDate || '');
  const [reason, setReason] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Conflict detection
  const [conflictingShifts, setConflictingShifts] = useState<ConflictingShift[]>([]);

  useEffect(() => {
    if (open) {
      const fetchLeaveTypes = async () => {
        const { data } = await supabase
          .from(TABLES.LEAVE_TYPES)
          .select('id, leave_type_name')
          .eq('is_active', true)
          .order('leave_type_name');
        setLeaveTypes((data as any[])?.map(d => ({ id: d.id, name: d.leave_type_name })) || []);
      };
      fetchLeaveTypes();

      if (isEdit && leaveId) {
        const load = async () => {
          setLoading(true);
          const { data } = await supabase
            .from(TABLES.LEAVE_REQUESTS)
            .select('leave_type_id, start_date, end_date, reason, attachment_url')
            .eq('id', leaveId)
            .maybeSingle();
          if (!data) throw new Error("You do not have permission to perform this action");
          if (data) {
            setLeaveTypeId(data.leave_type_id || '');
            setStartDate(data.start_date || '');
            setEndDate(data.end_date || '');
            setReason(data.reason || '');
            setExistingAttachmentUrl(data.attachment_url || null);
          }
          setLoading(false);
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
    if (!startDate || !endDate || !user?.staff_id || !open) {
      setConflictingShifts([]);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .select(`id, start_date, start_time, end_time, house:${TABLES.HOUSES}(house_name)`)
        .eq('staff_id', user.staff_id)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .order('start_date');
      setConflictingShifts((data as any[]) || []);
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [startDate, endDate, user?.staff_id, open]);

  const getFilenameFromUrl = getFilenameFromStorageUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff_id) return;
    if (!leaveTypeId || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    let attachmentUrl = existingAttachmentUrl || undefined;
    if (attachmentFile) {
      const fileName = `${Date.now()}-${attachmentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `leave-attachments/${user.staff_id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)        .upload(filePath, attachmentFile);
      if (uploadError) {
        toast.error('Failed to upload attachment');
        setSaving(false);
        return;
      }
      const { data: urlData, error: urlError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)        .createSignedUrl(filePath, 3600, { download: attachmentFile.name || true });
      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        toast.error('Failed to resolve attachment URL');
        setSaving(false);
        return;
      }
      attachmentUrl = urlData.signedUrl;
    }

    if (isEdit && leaveId) {
      const updates: {
        leave_type_id: string;
        start_date: string;
        end_date: string;
        reason: string | null;
        attachment_url?: string;
      } = {
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        ...(attachmentUrl !== undefined ? { attachment_url: attachmentUrl } : {}),
      };
      const { error } = await supabase.from(TABLES.LEAVE_REQUESTS).update(updates).eq('id', leaveId);
      if (error) { toast.error('Failed to update leave request'); setSaving(false); return; }
      toast.success('Leave request updated');
    } else {
      const { error } = await supabase.from(TABLES.LEAVE_REQUESTS).insert({
        staff_id: user.staff_id,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        attachment_url: attachmentUrl || null,
        status: LEAVE_STATUS.PENDING,
      });
      if (error) { toast.error('Failed to submit leave request'); setSaving(false); return; }
      toast.success('Leave request submitted successfully');
    }

    setSaving(false);
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Leave Request' : 'New Leave Request'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading details...</p>
          </div>
        ) : (
          <form id="leave-dialog-form" onSubmit={handleSubmit} className="space-y-5 py-4">
            {/* Conflict warning */}
            {conflictingShifts.length > 0 && (
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 flex gap-3">
                <AlertTriangle className="size-4 text-warning mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-warning-800">
                    {conflictingShifts.length} rostered shift{conflictingShifts.length !== 1 ? 's' : ''} overlap
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {conflictingShifts.map(s => (
                      <Badge key={s.id} variant="warning" appearance="light" className="text-[10px] px-1 h-4">
                        {format(parseISO(s.start_date), 'dd MMM')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type <span className="text-destructive">*</span></Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
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
                <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date <span className="text-destructive">*</span></Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="flex flex-col gap-2">
                {existingAttachmentUrl && !attachmentFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Paperclip className="size-3.5" />
                    <a href={existingAttachmentUrl} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px]" title={getFilenameFromUrl(existingAttachmentUrl)}>
                      {getFilenameFromUrl(existingAttachmentUrl)}
                    </a>
                    <button type="button" onClick={() => setExistingAttachmentUrl(null)} className="text-destructive">
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
                {attachmentFile ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Paperclip className="size-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{attachmentFile.name}</span>
                    <button type="button" onClick={() => setAttachmentFile(null)} className="text-destructive">
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
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
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
                )}
              </div>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="leave-dialog-form" disabled={saving || loading}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
