import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, Clock, Home, Users, FileText, Plus } from 'lucide-react';
import { useShiftNotesByParticipantId, ShiftNote } from '@/hooks/use-shift-notes';
import { useStaffLightweight } from '@/hooks/use-staff';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

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
  const location = useLocation();

  const { data: shiftNotesData = [], isLoading: loading, refetch } = useShiftNotesByParticipantId(participantId);
  const shiftNotes = shiftNotesData as unknown as ShiftNote[];
  const { data: staff = [] } = useStaffLightweight();

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleEdit = (note: ShiftNote & { tempId?: string }) => {
    if (note.tempId) {
      // For pending adds that haven't been saved yet, we still need the sheet or a way to edit
      // But for this refactor, let's prioritize the new clinical fields
      toast.info('Please save the participant profile before editing this new note in the full editor.');
      return;
    }
    
    if (!note.id) {
      console.error('Shift note ID is missing', note);
      toast.error('Unable to open this note: ID is missing.');
      return;
    }
    
    navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/${note.id}`, {
      state: { from: location.pathname + location.search }
    });
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
    }) as any[];

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
        {canAdd && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/new?participantId=${participantId}`, {
              state: { from: location.pathname + location.search }
            })}
            className="h-8 gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Add Note</span>
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
            {allNotes.map((note: any) => {
              const isPendingDelete = !note.isPendingAdd && pendingChanges?.toDelete.includes(note.id);
              const isPendingUpdate = note.isPendingUpdate;
              const isPendingAdd = note.isPendingAdd;
              
              const shiftTimes = note.shift?.start_time && note.shift?.end_time 
                ? `${note.shift.start_time} - ${note.shift.end_time}` 
                : note.shift_time;

              const houseName = note.house?.house_name || note.house_name;
              
              const participantList = note.shift?.participants
                ?.map((p: any) => p.participant?.participant_name)
                .filter(Boolean)
                .join(', ');

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
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {/* Date & Time */}
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {note.start_date ? format(parseISO(note.start_date), 'dd MMM yyyy') : '-'}
                        {shiftTimes && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            ({shiftTimes})
                          </span>
                        )}
                      </div>

                      {/* House */}
                      {houseName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Home className="size-3.5" />
                          {houseName}
                        </div>
                      )}

                      {/* Participants */}
                      {participantList && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3.5" />
                          <span className="max-w-[200px] truncate" title={participantList}>
                            {participantList}
                          </span>
                        </div>
                      )}

                      {/* Staff (Author) */}
                      {(() => {
                        const staffName = note.staff_name || note.staff?.staff_name || getStaffName(note.staff_id);
                        if (staffName === 'Unknown Staff') return null;
                        
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">By:</span>
                            <Link 
                              to={`${ROUTES.STAFF_DETAIL}/${note.staff?.id || note.staff_id}`}
                              className="flex items-center gap-1.5 group/staff"
                            >
                              <SecureAvatar 
                                src={note.staff?.photo_url} 
                                initials={getInitials(staffName)} 
                                className="size-5 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20"
                                bucket={STORAGE_BUCKETS.STAFF_PHOTOS} 
                              />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-400 group-hover/staff:underline transition-colors">
                                {staffName}
                              </span>
                            </Link>
                          </div>
                        );
                      })()}

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

                  {/* Shift Summary */}
                  {note.shift_summary && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-50/50 p-2.5 dark:bg-blue-900/10">
                      <FileText className="mt-0.5 size-3.5 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Shift Summary</div>
                        <div className="text-xs italic text-blue-800 dark:text-blue-200 line-clamp-2">
                          {note.shift_summary}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Note Content */}
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
