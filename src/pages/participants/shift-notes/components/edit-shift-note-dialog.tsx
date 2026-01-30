'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
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
import { toast } from 'sonner';

interface EditShiftNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftNote: ShiftNote | null;
  onSave: (id: string, data: ShiftNoteUpdateData) => Promise<{ data: any; error: string | null }>;
  onCreate?: (data: ShiftNoteUpdateData) => Promise<{ data: any; error: string | null }>;
  onSuccess?: () => void;
  mode?: 'edit' | 'create';
}

export function EditShiftNoteDialog({
  open,
  onOpenChange,
  shiftNote,
  onSave,
  onCreate,
  onSuccess,
  mode = 'edit',
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
    notes: null,
    tags: [],
    full_note: null,
  });
  const [saving, setSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

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
          notes: null,
          tags: [],
          full_note: null,
        });
        setTagInput('');
      } else if (shiftNote) {
        // Populate form with existing shift note data
        setFormData({
          participant_id: shiftNote.participant_id || null,
          staff_id: shiftNote.staff_id || null,
          shift_date: shiftNote.shift_date,
          shift_time: shiftNote.shift_time || null,
          house_id: shiftNote.house_id || null,
          notes: shiftNote.notes || null,
          tags: shiftNote.tags || [],
          full_note: shiftNote.full_note || null,
        });
        setTagInput('');
      }
    }
  }, [shiftNote, open, mode]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,$/g, '');
      if (newTag && !formData.tags?.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), newTag],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        shift_date: format(date, 'yyyy-MM-dd'),
      }));
      setDatePickerOpen(false);
    }
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
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  staff_id: value === 'none' ? null : value,
                }))
              }
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

          {/* Tags - Text Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Type tag and press Enter or comma"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ms-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
