import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/auth/context/auth-context';
import { useActiveParticipants } from '@/hooks/use-participants';
import { useShiftNotes } from '@/hooks/use-shift-notes';
import { StaffShift } from './use-roster-data';
import { FileText, User, Clock, Home, Calendar, Loader2 } from 'lucide-react';
import { shiftNotesApi } from '@/api/shift-notes.api';

interface StaffShiftNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: StaffShift | null;
  onSuccess?: () => void;
}

export function StaffShiftNoteDialog({
  open,
  onOpenChange,
  shift,
  onSuccess,
}: StaffShiftNoteDialogProps) {
  const { user } = useAuth();
  const { createShiftNote } = useShiftNotes();
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [formData, setFormData] = useState({
    participant_id: '',
    shift_time: format(new Date(), 'HH:mm'),
    notes: '',
  });

  const { participants: allParticipants, loading: loadingParticipants } = useActiveParticipants();

  const participants = useMemo(() => {
    if (!shift?.house_id) return [];
    return allParticipants.filter(p => p.house_id === shift.house_id);
  }, [allParticipants, shift?.house_id]);

  useEffect(() => {
    if (open && shift && user?.staff_id) {
      const loadExistingNote = async () => {
        setFetching(true);
        // Reset to defaults first
        setFormData({
          participant_id: 'none',
          shift_time: format(new Date(), 'HH:mm'),
          notes: '',
        });

        try {
          const data = await shiftNotesApi.getByShiftAndStaff(shift.id, user.staff_id!);

          if (data) {
            setFormData({
              participant_id: data.participant_id || 'none',
              shift_time: data.shift_time || format(new Date(), 'HH:mm'),
              notes: data.full_note || '',
            });
          }
        } catch (err) {
          console.error('Error loading existing note:', err);
        } finally {
          setFetching(false);
        }
      };

      loadExistingNote();
    }
  }, [open, shift, user?.staff_id]);

  if (!shift) return null;

  const handleSave = async () => {
    if (!formData.notes.trim()) {
      toast.error('Please enter note content');
      return;
    }

    setSaving(true);
    try {
      await createShiftNote({
        shift_id: shift.id,
        staff_id: user?.staff_id,
        house_id: shift.house_id,
        start_date: shift.start_date,
        shift_time: formData.shift_time,
        participant_id: formData.participant_id === 'none' || !formData.participant_id ? null : formData.participant_id,
        full_note: formData.notes,
        notes: formData.notes.slice(0, 100),
      });

      toast.success('Shift note saved successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to save shift note:', error);
      toast.error(`Failed to save note: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Write Shift Note
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a clinical note for this shift.
          </DialogDescription>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-primary/60" />
              {format(parseISO(shift.start_date), 'dd MMM yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Home className="size-3 text-primary/60" />
              {shift.house?.house_name}
            </span>
            <span className="flex items-center gap-1">
              <User className="size-3 text-primary/60" />
              {user?.fullname || 'My Note'}
            </span>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2 relative min-h-[200px]">
          {fetching && (
            <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Time - Defaults to Now */}
            <div className="space-y-1.5">
              <Label htmlFor="noteTime" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-0.5">
                <Clock className="size-3" />
                Note Time
              </Label>
              <Input
                id="noteTime"
                type="time"
                value={formData.shift_time}
                onChange={(e) => setFormData({ ...formData, shift_time: e.target.value })}
                className="bg-muted/30"
              />
            </div>

            {/* Participant - Filtered to House + Active */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-0.5">
                <User className="size-3" />
                Participant <span className="text-[9px] lowercase font-normal italic opacity-60">(Optional)</span>
              </Label>
              <Select
                value={formData.participant_id || 'none'}
                onValueChange={(val) => setFormData({ ...formData, participant_id: val })}
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="General Note" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Note</SelectItem>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.participant_name}
                    </SelectItem>
                  ))}
                  {loadingParticipants && participants.length === 0 && (
                    <div className="p-2 text-center text-xs italic">Loading participants...</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Note Content */}
          <div className="space-y-1.5">
            <Label htmlFor="noteContent" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-0.5">
              <FileText className="size-3" />
              Observation / Note
            </Label>
            <Textarea
              id="noteContent"
              placeholder="Record clinical observations, participant wellbeing, or shift events..."
              rows={8}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="resize-none bg-muted/10 focus:bg-background transition-colors"
            />
          </div>
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving || fetching} className="text-muted-foreground">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || fetching} className="min-w-[140px] shadow-lg shadow-primary/20">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Shift Note'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
