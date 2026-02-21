import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Pencil, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useShiftNotes, ShiftNote } from '@/hooks/useShiftNotes';
import { toast } from 'sonner';

export interface ShiftFormData {
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  house_id: string;
  shift_type: string;
  status: string;
  notes: string;
  participant_ids: string[];
}

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any | null;
  staffId?: string;
  staffList: Array<{ id: string; name: string }>;
  staffSelectionDisabled: boolean;
  houses: Array<{ id: string; name: string }>;
  participants: Array<{ id: string; name: string }>;
  onSave: (formData: ShiftFormData) => Promise<{ id: string } | void>;
  onDelete?: (shiftId: string) => Promise<void>;
  scrollToNotes?: boolean;
  readOnly?: boolean;
}

/** A draft note not yet saved to the DB (used in create mode or when adding new notes) */
interface DraftNote {
  id: string; // temporary local id
  notes: string;
  full_note: string;
  participant_id: string | null;
}

export function ShiftDialog({
  open,
  onOpenChange,
  shift,
  staffId,
  staffList,
  staffSelectionDisabled,
  houses,
  participants,
  onSave,
  onDelete,
  scrollToNotes = false,
  readOnly = false,
}: ShiftDialogProps) {
  const notesSectionRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ShiftFormData>({
    staff_id: staffId || '',
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    house_id: '',
    shift_type: 'SIL',
    status: 'Scheduled',
    notes: '',
    participant_ids: [],
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Shift Notes state
  const [existingNotes, setExistingNotes] = useState<ShiftNote[]>([]);
  const [draftNotes, setDraftNotes] = useState<DraftNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const { fetchShiftNotesByShiftId, createShiftNote, updateShiftNote, deleteShiftNote } = useShiftNotes();

  // Track which existing note is being edited
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  // Local edit buffer for the note being edited
  const [editBuffer, setEditBuffer] = useState<{ notes: string; full_note: string }>({ notes: '', full_note: '' });
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const isEdit = shift !== null;

  useEffect(() => {
    if (shift) {
      setFormData({
        staff_id: shift.staff_id || staffId || '',
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        house_id: shift.house_id || '',
        shift_type: shift.shift_type,
        status: shift.status,
        notes: shift.notes || '',
        participant_ids: shift.participants?.map((p: any) => p.id) || [],
      });
      // Load existing shift notes for edit mode
      setNotesLoading(true);
      fetchShiftNotesByShiftId(shift.id).then(notes => {
        setExistingNotes(notes);
        setNotesLoading(false);
      });
    } else {
      setFormData({
        staff_id: staffId || '',
        shift_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '17:00',
        house_id: '',
        shift_type: 'SIL',
        status: 'Scheduled',
        notes: '',
        participant_ids: [],
      });
      setExistingNotes([]);
    }
    setDraftNotes([]);
  }, [shift, staffId, open]);

  useEffect(() => {
    if (open && scrollToNotes && notesSectionRef.current) {
      setTimeout(() => {
        notesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [open, scrollToNotes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await onSave(formData);
      // In create mode, save any draft notes now that we have the shift id
      if (!isEdit && draftNotes.length > 0 && result?.id) {
        const newShiftId = result.id;
        await Promise.all(
          draftNotes
            .filter(d => d.notes.trim() || d.full_note.trim())
            .map(draft =>
              createShiftNote({
                shift_id: newShiftId,
                staff_id: formData.staff_id || null,
                shift_date: formData.shift_date,
                house_id: formData.house_id || null,
                shift_time: formData.start_time,
                participant_id: draft.participant_id,
                notes: draft.notes || null,
                full_note: draft.full_note || null,
              })
            )
        );
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shift || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(shift.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  const toggleParticipant = (participantId: string) => {
    const currentIds = formData.participant_ids;
    if (currentIds.includes(participantId)) {
      setFormData({
        ...formData,
        participant_ids: currentIds.filter(id => id !== participantId),
      });
    } else {
      setFormData({
        ...formData,
        participant_ids: [...currentIds, participantId],
      });
    }
  };

  // --- Shift Notes handlers ---

  const handleAddDraftNote = () => {
    const newDraft: DraftNote = {
      id: `draft-${Date.now()}`,
      notes: '',
      full_note: '',
      participant_id: null,
    };
    setDraftNotes(prev => [...prev, newDraft]);
  };

  const handleUpdateDraftNote = (id: string, field: keyof DraftNote, value: string | null) => {
    setDraftNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const handleRemoveDraftNote = (id: string) => {
    setDraftNotes(prev => prev.filter(n => n.id !== id));
  };

  /** Save a draft note immediately (edit mode — shift already exists) */
  const handleSaveDraftNote = async (draft: DraftNote) => {
    if (!shift) return;
    setSavingNoteId(draft.id);
    try {
      const { data, error } = await createShiftNote({
        shift_id: shift.id,
        staff_id: shift.staff_id || null,
        shift_date: shift.shift_date,
        house_id: shift.house_id || null,
        shift_time: shift.start_time,
        participant_id: draft.participant_id,
        notes: draft.notes || null,
        full_note: draft.full_note || null,
      });
      if (error) {
        toast.error('Failed to save note');
      } else {
        toast.success('Note saved');
        setExistingNotes(prev => [...prev, data]);
        setDraftNotes(prev => prev.filter(n => n.id !== draft.id));
      }
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleStartEditNote = (note: ShiftNote) => {
    setEditingNoteId(note.id);
    setEditBuffer({ notes: note.notes || '', full_note: note.full_note || '' });
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditBuffer({ notes: '', full_note: '' });
  };

  const handleSaveEditNote = async (noteId: string) => {
    setSavingNoteId(noteId);
    try {
      const { error } = await updateShiftNote(noteId, {
        notes: editBuffer.notes || null,
        full_note: editBuffer.full_note || null,
      });
      if (error) {
        toast.error('Failed to update note');
      } else {
        setExistingNotes(prev => prev.map(n =>
          n.id === noteId ? { ...n, notes: editBuffer.notes || null, full_note: editBuffer.full_note || null } : n
        ));
        setEditingNoteId(null);
        toast.success('Note updated');
      }
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    try {
      const { error } = await deleteShiftNote(noteId);
      if (error) {
        toast.error('Failed to delete note');
      } else {
        setExistingNotes(prev => prev.filter(n => n.id !== noteId));
        toast.success('Note deleted');
      }
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update shift details and assignments.' : 'Create a new shift and assign participants.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staff_id">Staff Member *</Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                disabled={staffSelectionDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || 'Unnamed Staff'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shift_date">Date *</Label>
              <Input
                id="shift_date"
                type="date"
                value={formData.shift_date}
                onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="house_id">House</Label>
              <Select 
                value={formData.house_id || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, house_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {houses.map(house => (
                    <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="No Show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="shift_type">Shift Type *</Label>
            <Select value={formData.shift_type} onValueChange={(value) => setFormData({ ...formData, shift_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIL">SIL</SelectItem>
                <SelectItem value="Community">Community</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="participant_ids">Linked Participants</Label>
            <Select
              value={formData.participant_ids[0] || ''}
              onValueChange={toggleParticipant}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select participants" />
              </SelectTrigger>
              <SelectContent>
                {participants.map(participant => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.participant_ids.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.participant_ids.map(id => {
                  const participant = participants.find(p => p.id === id);
                  return participant ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {participant.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleParticipant(id)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Shift Notes (internal)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any internal shift notes..."
              rows={2}
            />
          </div>

          {/* ── Shift Notes Section ── */}
          <div ref={notesSectionRef} className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Shift Notes
                  {existingNotes.length > 0 && (
                    <Badge variant="secondary" size="sm" className="ml-2">{existingNotes.length}</Badge>
                  )}
                </span>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDraftNote}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Note
                </Button>
              )}
            </div>

            {/* Existing saved notes (edit mode) */}
            {notesLoading && (
              <p className="text-xs text-muted-foreground">Loading notes...</p>
            )}
            {existingNotes.map((note) => {
              const isEditing = editingNoteId === note.id;
              const isDeleting = deletingNoteId === note.id;
              const isSaving = savingNoteId === note.id;
              return (
                <div key={note.id} className="rounded-md border bg-muted/30 p-3 space-y-2">
                  {/* Header row: participant + date + action buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {note.participant?.name
                        ? <span className="font-medium text-foreground">{note.participant.name}</span>
                        : <span className="text-muted-foreground">General</span>}
                      {note.created_at && (
                        <span className="ml-2">{format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}</span>
                      )}
                    </span>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleStartEditNote(note)}
                          title="Edit note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={isDeleting}
                          title="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* View mode */}
                  {!isEditing && (
                    <>
                      {note.notes && <p className="text-sm">{note.notes}</p>}
                      {note.full_note && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">{note.full_note}</p>
                      )}
                      {!note.notes && !note.full_note && (
                        <p className="text-xs text-muted-foreground italic">No content</p>
                      )}
                    </>
                  )}

                  {/* Edit mode */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Textarea
                        value={editBuffer.notes}
                        onChange={(e) => setEditBuffer(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Note summary..."
                        rows={2}
                        className="text-sm"
                        autoFocus
                      />
                      <Textarea
                        value={editBuffer.full_note}
                        onChange={(e) => setEditBuffer(prev => ({ ...prev, full_note: e.target.value }))}
                        placeholder="Full note details (optional)..."
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveEditNote(note.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEditNote}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Draft notes (unsaved — shown in both create and edit mode) */}
            {draftNotes.map((draft) => (
              <div key={draft.id} className="rounded-md border border-dashed border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">New note</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveDraftNote(draft.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Participant selector for this note */}
                {participants.length > 0 && (
                  <Select
                    value={draft.participant_id || 'none'}
                    onValueChange={(v) => handleUpdateDraftNote(draft.id, 'participant_id', v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Participant (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / All participants</SelectItem>
                      {participants.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Textarea
                  value={draft.notes}
                  onChange={(e) => handleUpdateDraftNote(draft.id, 'notes', e.target.value)}
                  placeholder="Note summary..."
                  rows={2}
                  className="text-sm"
                />
                <Textarea
                  value={draft.full_note}
                  onChange={(e) => handleUpdateDraftNote(draft.id, 'full_note', e.target.value)}
                  placeholder="Full note details (optional)..."
                  rows={3}
                  className="text-sm"
                />

                {/* Only show Save button in edit mode — in create mode notes save with the shift */}
                {isEdit && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSaveDraftNote(draft)}
                    disabled={savingNoteId === draft.id || !draft.notes.trim()}
                  >
                    {savingNoteId === draft.id ? 'Saving...' : 'Save Note'}
                  </Button>
                )}
              </div>
            ))}

            {existingNotes.length === 0 && draftNotes.length === 0 && !notesLoading && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No shift notes yet. Click "Add Note" to create one.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!readOnly && isEdit && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button onClick={handleSave} disabled={saving || deleting}>
                {saving ? 'Saving...' : isEdit ? 'Update Shift' : 'Create Shift'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
