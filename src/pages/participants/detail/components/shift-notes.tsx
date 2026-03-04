import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { useShiftNotesByParticipantId, useCreateShiftNote, useUpdateShiftNote, useDeleteShiftNote } from '@/hooks/use-shift-notes';
import { useStaff } from '@/hooks/use-staff';
import { ParticipantPendingChanges } from '@/models/participant-pending-changes';
import { format } from 'date-fns';

interface ShiftNotesProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: ParticipantPendingChanges;
  onPendingChangesChange?: (changes: ParticipantPendingChanges) => void;
}

export function ShiftNotes({ 
  participantId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: ShiftNotesProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [formData, setFormData] = useState({
    shift_date: new Date().toISOString().split('T')[0],
    shift_time: '',
    staff_id: '',
    full_note: '',
  });

  const { data: shiftNotes = [], isLoading: loading } = useShiftNotesByParticipantId(participantId);
  const { data: staffData } = useStaff();
  const staff = staffData?.data || [];

  const { mutateAsync: createShiftNote } = useCreateShiftNote();
  const { mutateAsync: updateShiftNote } = useUpdateShiftNote();
  const { mutateAsync: deleteShiftNote } = useDeleteShiftNote();

  const handleAdd = () => {
    setEditingNote(null);
    setFormData({
      shift_date: new Date().toISOString().split('T')[0],
      shift_time: '',
      staff_id: '',
      full_note: '',
    });
    setShowSheet(true);
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setFormData({
      shift_date: note.shift_date,
      shift_time: note.shift_time || '',
      staff_id: note.staff_id || '',
      full_note: note.full_note || '',
    });
    setShowSheet(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shift note?')) {
      try {
        await deleteShiftNote(id);
      } catch (error) {
        console.error('Error deleting shift note:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingNote) {
        if (participantId) {
          await updateShiftNote({ id: editingNote.id, updates: { ...formData, participant_id: participantId } });
        }
      } else {
        if (participantId) {
          await createShiftNote({ ...formData, participant_id: participantId });
        }
      }
      setShowSheet(false);
    } catch (error) {
      console.error('Error saving shift note:', error);
    }
  };

  return (
    <Card id="shift_notes">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shift Notes</CardTitle>
        {canAdd && (
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4 me-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading shift notes...</p>
        ) : shiftNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shift notes recorded for this participant.</p>
        ) : (
          <div className="space-y-4">
            {shiftNotes.map((note) => (
              <div key={note.id} className="border border-border rounded-lg p-4 bg-muted/20 relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-background">
                      <Calendar className="size-3 me-1" />
                      {format(new Date(note.shift_date), 'dd MMM yyyy')}
                    </Badge>
                    {note.shift_time && (
                      <Badge variant="outline" className="bg-background">
                        <Clock className="size-3 me-1" />
                        {note.shift_time}
                      </Badge>
                    )}
                    <span className="text-sm font-medium text-foreground">
                      By: {note.staff_name || 'Unknown Staff'}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(note)}>
                      <Edit className="size-4" />
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDelete(note.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.full_note}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{editingNote ? 'Edit Shift Note' : 'Add Shift Note'}</SheetTitle>
            <SheetDescription>
              Record details about the participant's shift.
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="shift_date">Date</Label>
              <Input
                id="shift_date"
                type="date"
                value={formData.shift_date}
                onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shift_time">Time (Optional)</Label>
              <Input
                id="shift_time"
                placeholder="e.g. 09:00 AM - 17:00 PM"
                value={formData.shift_time}
                onChange={(e) => setFormData({ ...formData, shift_time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff_id">Staff Member</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select staff member</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full_note">Notes</Label>
              <Textarea
                id="full_note"
                rows={8}
                placeholder="Enter detailed shift notes..."
                value={formData.full_note}
                onChange={(e) => setFormData({ ...formData, full_note: e.target.value })}
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowSheet(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Note</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
