import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, AlertTriangle, Paperclip, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';

interface LeaveType {
  id: string;
  name: string;
}

interface ConflictingShift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  house?: { name: string } | null;
}

export function StaffLeaveForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  // Conflict detection
  const [conflictingShifts, setConflictingShifts] = useState<ConflictingShift[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      const { data } = await supabase
        .from('leave_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setLeaveTypes((data as LeaveType[]) || []);
    };
    fetchLeaveTypes();
  }, []);

  // Load existing leave for edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    const load = async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('leave_type_id, start_date, end_date, reason, attachment_url')
        .eq('id', id)
        .single();
      if (data) {
        setLeaveTypeId(data.leave_type_id || '');
        setStartDate(data.start_date || '');
        setEndDate(data.end_date || '');
        setReason(data.reason || '');
        setExistingAttachmentUrl(data.attachment_url || null);
      }
      setLoadingEdit(false);
    };
    load();
  }, [id, isEdit]);

  // Check for conflicting shifts when dates change
  useEffect(() => {
    if (!startDate || !endDate || !user?.staff_id) {
      setConflictingShifts([]);
      return;
    }
    if (new Date(endDate) < new Date(startDate)) return;

    const check = async () => {
      setCheckingConflicts(true);
      const { data } = await supabase
        .from('staff_shifts')
        .select('id, shift_date, start_time, end_time, house:houses(name)')
        .eq('staff_id', user.staff_id)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .not('status', 'eq', 'Cancelled');
      setConflictingShifts((data as ConflictingShift[]) || []);
      setCheckingConflicts(false);
    };
    check();
  }, [startDate, endDate, user?.staff_id]);

  const uploadAttachment = async (staffId: string): Promise<string | null> => {
    if (!attachmentFile) return existingAttachmentUrl;
    const ext = attachmentFile.name.split('.').pop();
    const path = `leave-attachments/${staffId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('staff-documents').upload(path, attachmentFile);
    if (error) { toast.error('Failed to upload attachment'); return null; }
    const { data } = supabase.storage.from('staff-documents').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff_id) return;

    if (!leaveTypeId || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be on or after start date');
      return;
    }

    setSaving(true);

    const attachmentUrl = await uploadAttachment(user.staff_id);

    if (isEdit && id) {
      const { error } = await supabase.from('leave_requests').update({
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        ...(attachmentUrl !== undefined ? { attachment_url: attachmentUrl } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) { toast.error('Failed to update leave request'); setSaving(false); return; }
      toast.success('Leave request updated');
    } else {
      const { error } = await supabase.from('leave_requests').insert({
        staff_id: user.staff_id,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        attachment_url: attachmentUrl,
        status: 'pending',
      });
      if (error) { toast.error('Failed to submit leave request'); setSaving(false); return; }
      toast.success('Leave request submitted successfully');
    }

    navigate('/staff/leave');
    setSaving(false);
  };

  if (loadingEdit) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/staff/leave')}>
                <ArrowLeft className="size-4 me-1.5" />
                Back
              </Button>
              <div>
                <ToolbarPageTitle text={isEdit ? 'Edit Leave Request' : 'New Leave Request'} />
                <ToolbarDescription>
                  {isEdit ? 'Update your pending leave request' : 'Submit a leave request for approval'}
                </ToolbarDescription>
              </div>
            </div>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={() => navigate('/staff/leave')} disabled={saving}>
              Cancel
            </Button>
            <Button form="leave-form" type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit Request'}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="max-w-2xl space-y-5">
          {/* Conflict warning */}
          {conflictingShifts.length > 0 && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 flex gap-3">
              <AlertTriangle className="size-5 text-warning mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {conflictingShifts.length} rostered shift{conflictingShifts.length !== 1 ? 's' : ''} overlap with these dates
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {conflictingShifts.map(s => (
                    <Badge key={s.id} variant="warning" appearance="light" className="text-xs">
                      {format(parseISO(s.shift_date), 'EEE dd MMM')}
                      {' '}{s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)}
                      {s.house?.name ? ` · ${s.house.name}` : ''}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your supervisor will see these conflicts when reviewing your request.
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="pt-6 pb-8">
              <form id="leave-form" onSubmit={handleSubmit} className="space-y-6">
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

                {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1} day(s)
                    {checkingConflicts && <span className="ml-2 text-xs">(checking conflicts...)</span>}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe the reason for your leave..."
                    rows={4}
                  />
                </div>

                {/* File attachment */}
                <div className="space-y-2">
                  <Label>Attachment <span className="text-muted-foreground text-xs">(optional — e.g. sick note)</span></Label>
                  {existingAttachmentUrl && !attachmentFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Paperclip className="size-3.5" />
                      <a href={existingAttachmentUrl} target="_blank" rel="noreferrer" className="underline truncate max-w-xs">
                        Existing attachment
                      </a>
                      <button type="button" onClick={() => setExistingAttachmentUrl(null)} className="text-destructive hover:text-destructive/80">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}
                  {attachmentFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="size-3.5 text-muted-foreground" />
                      <span className="truncate max-w-xs">{attachmentFile.name}</span>
                      <button type="button" onClick={() => setAttachmentFile(null)} className="text-destructive hover:text-destructive/80">
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
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="size-3.5 me-1.5" />
                        {existingAttachmentUrl ? 'Replace attachment' : 'Attach file'}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
