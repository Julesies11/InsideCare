'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Link, Link2Off } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ShiftNote, ShiftNoteUpdateData } from '@/hooks/useShiftNotes';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/useStaff';
import { useHouses } from '@/hooks/use-houses';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatTime } from '@/components/roster/roster-utils';

interface LinkedShiftInfo {
  id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
}

interface MatchedShiftOption {
  id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
}

interface EditShiftNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftNote: ShiftNote | null;
  onSave: (id: string, data: ShiftNoteUpdateData) => Promise<{ data: any; error: string | null }>;
  onCreate?: (data: ShiftNoteUpdateData) => Promise<{ data: any; error: string | null }>;
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
  const { participants } = useParticipants();
  const { staff } = useStaff();
  const { houses } = useHouses();

  const [formData, setFormData] = useState<ShiftNoteUpdateData>({
    participant_id: null,
    staff_id: null,
    shift_date: '',
    shift_time: null,
    house_id: null,
    shift_id: null,
    notes: null,
    full_note: null,
  });
  const [saving, setSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [linkedShift, setLinkedShift] = useState<LinkedShiftInfo | null>(null);
  const [matchedShiftOptions, setMatchedShiftOptions] = useState<MatchedShiftOption[]>([]);
  const [isMatchingShift, setIsMatchingShift] = useState(false);

  // Auto-match shift by staff_id + shift_date (Option 2)
  const autoMatchShift = useCallback(async (staffId: string | null, shiftDate: string | null) => {
    if (!staffId || !shiftDate || formData.shift_id) return;

    setIsMatchingShift(true);
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .select('id, start_time, end_time, shift_type, status')
        .eq('staff_id', staffId)
        .eq('shift_date', shiftDate)
        .order('start_time');

      if (error || !data || data.length === 0) {
        setMatchedShiftOptions([]);
        return;
      }

      if (data.length === 1) {
        // Single match — auto-link silently
        setFormData(prev => ({ ...prev, shift_id: data[0].id }));
        setLinkedShift(data[0]);
        setMatchedShiftOptions([]);
      } else {
        // Multiple matches — show dropdown for user to pick
        setMatchedShiftOptions(data);
      }
    } catch {
      // Silently fail — auto-match is best-effort
    } finally {
      setIsMatchingShift(false);
    }
  }, [formData.shift_id]);

  // Reset form when shiftNote changes or dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'create' || !shiftNote) {
        // Reset to empty form for creating new shift note
        setFormData({
          participant_id: null,
          staff_id: null,
          shift_date: format(new Date(), 'yyyy-MM-dd'),
          shift_time: null,
          house_id: null,
          shift_id: initialShiftId,
          notes: null,
          full_note: null,
        });
        setLinkedShift(initialLinkedShift);
        setMatchedShiftOptions([]);
      } else if (shiftNote) {
        // Populate form with existing shift note data
        setFormData({
          participant_id: shiftNote.participant_id || null,
          staff_id: shiftNote.staff_id || null,
          shift_date: shiftNote.shift_date,
          shift_time: shiftNote.shift_time || null,
          house_id: shiftNote.house_id || null,
          shift_id: shiftNote.shift_id || null,
          notes: shiftNote.notes || null,
          full_note: shiftNote.full_note || null,
        });
        setLinkedShift(shiftNote.shift || null);
        setMatchedShiftOptions([]);
      }
    }
  }, [shiftNote, open, mode, initialShiftId, initialLinkedShift]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = format(date, 'yyyy-MM-dd');
      setFormData((prev) => ({
        ...prev,
        shift_date: newDate,
        // Clear existing auto-match when date changes
        shift_id: initialShiftId || prev.shift_id,
      }));
      setDatePickerOpen(false);
      // Trigger auto-match with new date if no pre-set shift
      if (!initialShiftId && !formData.shift_id) {
        autoMatchShift(formData.staff_id || null, newDate);
      }
    }
  };

  const handleStaffChange = (value: string) => {
    const newStaffId = value === 'none' ? null : value;
    setFormData((prev) => ({
      ...prev,
      staff_id: newStaffId,
      // Clear auto-matched shift when staff changes (unless pre-set from roster)
      shift_id: initialShiftId || null,
    }));
    if (!initialShiftId) {
      setLinkedShift(null);
      setMatchedShiftOptions([]);
      // Trigger auto-match with new staff
      if (newStaffId && formData.shift_date) {
        autoMatchShift(newStaffId, formData.shift_date);
      }
    }
  };

  const handleSelectMatchedShift = (shiftId: string) => {
    const selected = matchedShiftOptions.find(s => s.id === shiftId);
    if (selected) {
      setFormData(prev => ({ ...prev, shift_id: selected.id }));
      setLinkedShift({ ...selected, status: '' });
      setMatchedShiftOptions([]);
    }
  };

  const handleClearShiftLink = () => {
    setFormData(prev => ({ ...prev, shift_id: null }));
    setLinkedShift(null);
    setMatchedShiftOptions([]);
  };

  const handleSubmit = async () => {
    if (!formData.shift_date) {
      toast.error('Please select a date');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create' && onCreate) {
        const { error } = await onCreate(formData);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Shift note created successfully');
          onOpenChange(false);
          onSuccess?.();
        }
      } else if (shiftNote) {
        const { error } = await onSave(shiftNote.id, formData);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Shift note updated successfully');
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } catch (err) {
      toast.error(mode === 'create' ? 'Failed to create shift note' : 'Failed to update shift note');
    } finally {
      setSaving(false);
    }
  };

  // Get active houses only
  const activeHouses = houses.filter((h) => h.status === 'active');

  const isCreateMode = mode === 'create';
  const dialogTitle = isCreateMode ? 'Add Shift Note' : 'Edit Shift Note';
  const dialogDescription = isCreateMode
    ? 'Create a new shift note with details about participants and activities.'
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
          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift_date">Date *</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.shift_date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.shift_date
                      ? format(new Date(formData.shift_date), 'dd MMM yyyy')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.shift_date
                        ? new Date(formData.shift_date)
                        : undefined
                    }
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift_time">Time</Label>
              <Input
                id="shift_time"
                type="time"
                value={formData.shift_time || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shift_time: e.target.value || null,
                  }))
                }
              />
            </div>
          </div>

          {/* House and Participant Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="house_id">House</Label>
              <Select
                value={formData.house_id || 'none'}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    house_id: value === 'none' ? null : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No house selected</SelectItem>
                  {activeHouses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant</Label>
              <Select
                value={formData.participant_id || 'none'}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    participant_id: value === 'none' ? null : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / All</SelectItem>
                  {participants.map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Staff Member */}
          <div className="space-y-2">
            <Label htmlFor="staff_id">Staff Member</Label>
            <Select
              value={formData.staff_id || 'none'}
              onValueChange={handleStaffChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No staff selected</SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked Shift — shown when auto-matched or pre-filled from roster */}
          {linkedShift && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-3 py-2">
              <Link className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-800 dark:text-emerald-300 flex-1">
                Linked to shift: <strong>{formatTime(linkedShift.start_time)} – {formatTime(linkedShift.end_time)}</strong>
                {linkedShift.shift_type && <span className="ml-1 text-emerald-600">({linkedShift.shift_type})</span>}
              </span>
              {!initialShiftId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-emerald-700 hover:text-red-600 hover:bg-red-50"
                  onClick={handleClearShiftLink}
                >
                  <Link2Off className="size-3.5" />
                </Button>
              )}
            </div>
          )}

          {/* Multiple shift matches — prompt user to pick one */}
          {matchedShiftOptions.length > 1 && (
            <div className="space-y-2">
              <Label>Multiple shifts found — select which shift to link</Label>
              <Select
                value={formData.shift_id || 'none'}
                onValueChange={(value) => value !== 'none' && handleSelectMatchedShift(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift to link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't link to a shift</SelectItem>
                  {matchedShiftOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {formatTime(s.start_time)} – {formatTime(s.end_time)} ({s.shift_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isMatchingShift && (
            <p className="text-xs text-muted-foreground">Finding matching shift...</p>
          )}

          {/* Summary Notes */}
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
            />
          </div>

          {/* Full Note */}
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
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
