'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { toast } from 'sonner';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useHouses } from '@/hooks/use-houses';
import { useParticipants } from '@/hooks/use-participants';
import { ShiftNote, ShiftNoteUpdateData } from '@/hooks/use-shift-notes';
import { useStaff } from '@/hooks/use-staff';
import { useStaffShifts } from '@/hooks/use-staff-shifts';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface LinkedShiftInfo {
  id: string;
  start_time: string;
  end_time: string;
  shift_template: string;
  status: string;
}

interface EditShiftNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftNote: ShiftNote | null;
  onSave: (
    id: string,
    data: ShiftNoteUpdateData,
  ) => Promise<{ data: any; error: string | null }>;
  onCreate?: (
    data: ShiftNoteUpdateData,
  ) => Promise<{ data: any; error: string | null }>;
  onSuccess?: () => void;
  mode?: 'edit' | 'create';
  /** Pre-fill shift_id when launched from the roster "Write Note" button */
  initialShiftId?: string | null;
  /** Pre-fill linked shift info for display when launched from roster */
  initialLinkedShift?: LinkedShiftInfo | null;
}

export function EditShiftNoteDialog({
  open,
  onOpenChange,
  shiftNote,
  onSave,
  onCreate,
  onSuccess,
  mode = 'edit',
  initialShiftId = null,
  initialLinkedShift = null,
}: EditShiftNoteDialogProps) {
  const { data: staffData } = useStaff();
  const staff = staffData?.data || [];
  const { houses } = useHouses(0, 1000);
  const { hasAccess } = useRBAC();

  const [formData, setFormData] = useState<ShiftNoteUpdateData>({
    participant_id: null,
    staff_id: null,
    start_date: '',
    shift_time: null,
    house_id: null,
    shift_id: null,
    notes: null,
    full_note: null,
  });

  // Filter participants to only show active ones from the selected house (if any)
  const { participants, loading: loadingParticipants } = useParticipants(
    0,
    1000,
    [],
    {
      houses: formData.house_id ? [formData.house_id as string] : [],
      statuses: ['active'],
    },
  );

  // Fetch shifts for the last 14 days
  const startDate = format(subDays(new Date(), 14), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const { shifts, loading: loadingShifts } = useStaffShifts(
    'all',
    startDate,
    endDate,
  );

  const canEdit = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canAdd = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canSubmit = mode === 'create' ? canAdd : canEdit;

  const [saving, setSaving] = useState(false);

  // Reset form when shiftNote changes or dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'create' || !shiftNote) {
        setFormData({
          participant_id: null,
          staff_id: null,
          start_date: format(new Date(), 'yyyy-MM-dd'),
          shift_time: null,
          house_id: null,
          shift_id: initialShiftId,
          notes: null,
          full_note: null,
        });

        // If we have an initialShiftId, find it in shifts and populate
        if (initialShiftId) {
          const shift = shifts.find((s) => s.id === initialShiftId);
          if (shift) {
            setFormData((prev) => ({
              ...prev,
              start_date: shift.start_date,
              shift_time: shift.start_time,
              house_id: shift.house_id,
              staff_id: shift.staff_id,
            }));
          }
        }
      } else if (shiftNote) {
        setFormData({
          participant_id: shiftNote.participant_id || null,
          staff_id: shiftNote.staff_id || null,
          start_date: shiftNote.start_date,
          shift_time: shiftNote.shift_time || null,
          house_id: shiftNote.house_id || null,
          shift_id: shiftNote.shift_id || null,
          notes: shiftNote.notes || null,
          full_note: shiftNote.full_note || null,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftNote, open, mode, initialShiftId]);

  const handleShiftChange = (shiftId: string) => {
    if (shiftId === 'none') {
      setFormData((prev) => ({
        ...prev,
        shift_id: null,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        shift_time: null,
        house_id: null,
        staff_id: null,
      }));
      return;
    }

    const shift = shifts.find((s) => s.id === shiftId);
    if (shift) {
      setFormData((prev) => ({
        ...prev,
        shift_id: shift.id,
        start_date: shift.start_date,
        shift_time: shift.start_time,
        house_id: shift.house_id,
        staff_id: shift.staff_id,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.shift_id) {
      toast.error('Please select a shift');
      return;
    }

    setSaving(true);
    const sanitizedData = {
      ...formData,
      notes: formData.notes || null,
      full_note: formData.full_note || null,
    };

    try {
      if (mode === 'create' && onCreate) {
        const { error } = await onCreate(sanitizedData);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Shift note created successfully');
          onOpenChange(false);
          onSuccess?.();
        }
      } else if (shiftNote?.id) {
        const { error } = await onSave(shiftNote.id, sanitizedData);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Shift note updated successfully');
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } catch (err) {
      console.error('Error submitting shift note:', err);
      toast.error('Failed to save shift note');
    } finally {
      setSaving(false);
    }
  };

  const selectedStaff = staff.find((s) => s.id === formData.staff_id);
  const selectedHouse = houses.find((h) => h.id === formData.house_id);

  const isCreateMode = mode === 'create';
  const dialogTitle = isCreateMode ? 'Add Shift Note' : 'Edit Shift Note';
  const dialogDescription = isCreateMode
    ? 'Create a new shift note by selecting a shift.'
    : 'Update the shift note details below.';
  const submitButtonText = isCreateMode ? 'Create Shift Note' : 'Save Changes';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift_id">Select Shift *</Label>
              <Select
                value={formData.shift_id || 'none'}
                onValueChange={handleShiftChange}
                disabled={!canSubmit || (!isCreateMode && !!formData.shift_id)}
              >
                <SelectTrigger id="shift_id">
                  <SelectValue
                    placeholder={
                      loadingShifts ? 'Loading shifts...' : 'Select a shift'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a shift...</SelectItem>
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {format(parseISO(s.start_date), 'EEE, MMM d')} -{' '}
                      {s.start_time.substring(0, 5)} (
                      {s.staff_info?.staff_name || 'Unassigned'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant *</Label>
              <Select
                value={formData.participant_id || 'none'}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    participant_id: value === 'none' ? null : value,
                  }))
                }
                disabled={!canSubmit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No participant selected</SelectItem>
                  {participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.participant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.shift_id && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Date
                </span>
                <p className="text-sm font-medium">
                  {formData.start_date
                    ? format(parseISO(formData.start_date), 'PPP')
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Time
                </span>
                <p className="text-sm font-medium">
                  {formData.shift_time
                    ? formData.shift_time.substring(0, 5)
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Staff
                </span>
                <p className="text-sm font-medium">
                  {selectedStaff?.staff_name || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  House
                </span>
                <p className="text-sm font-medium">
                  {selectedHouse?.house_name || 'N/A'}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Summary</Label>
            <Textarea
              id="notes"
              placeholder="Brief summary of the shift note..."
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value || null,
                }))
              }
              rows={2}
              disabled={!canSubmit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_note">Full Note</Label>
            <Textarea
              id="full_note"
              placeholder="Enter detailed shift note here..."
              value={formData.full_note || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  full_note: e.target.value || null,
                }))
              }
              rows={5}
              disabled={!canSubmit}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? 'Saving...' : submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
