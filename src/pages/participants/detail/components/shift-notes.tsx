import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { useShiftNotesByParticipantId } from '@/hooks/use-shift-notes';
import { useStaff } from '@/hooks/use-staff';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

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
  refreshTrigger?: number;
}

export function ShiftNotes({ 
  participantId, 
  canAdd, 
  canDelete,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
  refreshTrigger,
}: ShiftNotesProps) {
  const navigate = useNavigate();

  const { data: shiftNotes = [], isLoading: loading, refetch } = useShiftNotesByParticipantId(participantId);
  const { data: staffData } = useStaff();
  const staff = staffData?.data || [];

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleEdit = (note: any) => {
    if (note.tempId) {
      // For pending adds that haven't been saved yet, we still need the sheet or a way to edit
      // But for this refactor, let's prioritize the new clinical fields
      toast.info('Please save the participant profile before editing this new note in the full editor.');
      return;
    }
    navigate(`/shift-notes/detail/${note.id}`);
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
    return staff.find(s => s.id === id)?.staff_name || 'Unknown Staff';
  };

  return (
    <Card id="shift_notes">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shift Notes</CardTitle>
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
                        By: {note.staff?.staff_name || getStaffName(note.staff_id)}
                      </Badge>
                      {isPendingAdd && <Badge variant="outline" className="text-[10px] uppercase">New</Badge>}
                      {isPendingUpdate && <Badge variant="outline" className="text-[10px] uppercase border-warning text-warning">Pending Update</Badge>}
                      {isPendingDelete && <Badge variant="destructive" className="text-[10px] uppercase">Pending Delete</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      {!isPendingDelete && !isPendingAdd && !isPendingUpdate && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(note)} disabled={!canEdit}>
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
                        <Button variant="ghost" size="sm" onClick={() => handleUndoUpdate(note.id)} disabled={!canEdit}>
                          Undo
                        </Button>
                      )}
                      {isPendingDelete && (
                        <Button variant="ghost" size="sm" onClick={() => handleUndoDelete(note.id)} disabled={!canEdit}>
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
    </Card>
  );
}
