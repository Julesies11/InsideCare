import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { ShiftNote, useShiftNotesByParticipantId } from '@/hooks/use-shift-notes';
import { useStaff } from '@/hooks/use-staff';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ShiftNotePendingChanges {
  toAdd: any[];
  toUpdate: any[];
  toDelete: string[];
}

interface ShiftNotesProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  canEdit: boolean;
  pendingChanges?: ShiftNotePendingChanges;
  onPendingChangesChange?: (changes: ShiftNotePendingChanges) => void;
}

export function ShiftNotes({ 
  participantId, 
  canAdd, 
  canDelete,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
}: ShiftNotesProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [editingNote, setEditingNote] = useState<{ id?: string; tempId?: string; start_date: string; shift_time?: string; staff_id: string; full_note: string } | null>(null);
  
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    shift_time: '',
    staff_id: '',
    full_note: '',
  });

  const { data: shiftNotes = [], isLoading: loading } = useShiftNotesByParticipantId(participantId);
  const { data: staffData } = useStaff();
  const staff = staffData?.data || [];

  const handleAdd = () => {
    setEditingNote(null);
    setFormData({
      start_date: new Date().toISOString().split('T')[0],
      shift_time: '',
      staff_id: '',
      full_note: '',
    });
    setShowSheet(true);
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setFormData({
      start_date: note.start_date,
      shift_time: note.shift_time || '',
      staff_id: note.staff_id || '',
      full_note: note.full_note || '',
    });
    setShowSheet(true);
  };

  const handleSave = () => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingNote) {
      if (editingNote.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          toAdd: pendingChanges.toAdd.map(n => 
            n.tempId === editingNote.tempId ? { ...n, ...formData } : n
          ),
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          toUpdate: [
            ...pendingChanges.toUpdate.filter(n => n.id !== editingNote.id),
            { id: editingNote.id, ...formData },
          ],
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new note
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        toAdd: [
          ...pendingChanges.toAdd,
          { tempId, ...formData },
        ],
      };
      onPendingChangesChange(newPending);
    }

    setShowSheet(false);
  };

  const handleDelete = (note: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (note.tempId) {
      // Remove from pending add
      const newPending = {
        ...pendingChanges,
        toAdd: pendingChanges.toAdd.filter(n => n.tempId !== note.tempId),
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (confirm('Mark this shift note for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        toDelete: [...pendingChanges.toDelete, note.id],
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleUndoUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      toUpdate: pendingChanges.toUpdate.filter(n => n.id !== id),
    };
    onPendingChangesChange(newPending);
  };

  const handleUndoDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      toDelete: pendingChanges.toDelete.filter(noteId => noteId !== id),
    };
    onPendingChangesChange(newPending);
  };

  // Combine server data with pending changes
  const visibleNotes = shiftNotes
    .filter(note => !pendingChanges?.toDelete.includes(note.id))
    .map(note => {
      const update = pendingChanges?.toUpdate.find(u => u.id === note.id);
      return update ? { ...note, ...update, isPendingUpdate: true } : note;
    });

  const allNotes = [
    ...visibleNotes,
    ...(pendingChanges?.toAdd.map(n => ({ ...n, isPendingAdd: true })) || []),
  ].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const getStaffName = (id: string) => {
    return staff.find(s => s.id === id)?.name || 'Unknown Staff';
  };

  return (
    <Card id="shift_notes">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shift Notes</CardTitle>
        {canAdd && (
          <Button size="sm" onClick={handleAdd} disabled={!participantId || !canEdit}>
            <Plus className="size-4 me-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading shift notes...</div>
        ) : allNotes.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground italic">No shift notes available for this participant</div>
        ) : (
          <div className="space-y-4">
            {allNotes.map((note) => {
              const isPendingDelete = !note.isPendingAdd && pendingChanges?.toDelete.includes(note.id);
              const isPendingUpdate = note.isPendingUpdate;
              const isPendingAdd = note.isPendingAdd;
              
              return (
                <div 
                  key={note.id || note.tempId} 
                  className={cn(
                    "p-4 border rounded-xl bg-background hover:bg-muted/30 transition-all",
                    isPendingAdd && "bg-primary/5 border-primary/20",
                    isPendingUpdate && "bg-warning/5 border-warning/20",
                    isPendingDelete && "opacity-50 grayscale bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {note.start_date ? format(parseISO(note.start_date), 'dd MMM yyyy') : '-'}
                      </div>
                      {note.shift_time && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          {note.shift_time}
                        </div>
                      )}
                      <Badge variant="secondary" appearance="light" className="text-[10px]">
                        By: {note.staff?.name || getStaffName(note.staff_id)}
                      </Badge>
                      {isPendingAdd && <Badge variant="outline" className="text-[10px] uppercase">New</Badge>}
                      {isPendingUpdate && <Badge variant="outline" className="text-[10px] uppercase border-warning text-warning">Pending Update</Badge>}
                      {isPendingDelete && <Badge variant="destructive" className="text-[10px] uppercase">Pending Delete</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      {!isPendingDelete && !isPendingAdd && !isPendingUpdate && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(note)}>
                            <Edit className="size-3.5" />
                          </Button>
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(note)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {isPendingAdd && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(note)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                      {isPendingUpdate && (
                        <Button variant="ghost" size="sm" onClick={() => handleUndoUpdate(note.id)}>
                          Undo
                        </Button>
                      )}
                      {isPendingDelete && (
                        <Button variant="ghost" size="sm" onClick={() => handleUndoDelete(note.id)}>
                          Undo
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border-l-2 pl-4 py-1",
                    isPendingDelete ? "border-red-200 line-through" : "border-primary/10"
                  )}>
                    {note.full_note}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingNote ? 'Edit Shift Note' : 'Add Shift Note'}</SheetTitle>
            <SheetDescription>
              {editingNote ? 'Update the shift note details.' : 'Enter detailed notes for this shift.'}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time (Optional)</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.shift_time || ''}
                  onChange={(e) => setFormData({ ...formData, shift_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(val) => setFormData({ ...formData, staff_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Shift Note</Label>
              <Textarea
                id="note"
                rows={10}
                placeholder="Detailed observations and actions during shift..."
                value={formData.full_note || ''}
                onChange={(e) => setFormData({ ...formData, full_note: e.target.value })}
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowSheet(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.full_note || !formData.staff_id || !formData.start_date}>
              {editingNote ? 'Update Queue' : 'Add to Queue'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
