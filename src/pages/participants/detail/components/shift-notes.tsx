import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, Clock, X } from 'lucide-react';
import { useParticipantShiftNotes } from '@/hooks/useParticipantShiftNotes';
import { useStaff } from '@/hooks/useStaff';
import { ParticipantPendingChanges } from '@/models/participant-pending-changes';

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
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    shift_date: new Date().toISOString().split('T')[0],
    shift_time: '',
    staff_id: '',
    full_note: '',
    tags: [] as string[],
  });

  const { shiftNotes, loading } = useParticipantShiftNotes(participantId);
  const { staff } = useStaff();

  const handleAdd = () => {
    setEditingNote(null);
    setTagInput('');
    setFormData({
      shift_date: new Date().toISOString().split('T')[0],
      shift_time: '',
      staff_id: '',
      full_note: '',
      tags: [],
    });
    setShowSheet(true);
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setTagInput('');
    setFormData({
      shift_date: note.shift_date || new Date().toISOString().split('T')[0],
      shift_time: note.shift_time || '',
      staff_id: note.staff_id || '',
      full_note: note.full_note || '',
      tags: note.tags || [],
    });
    setShowSheet(true);
  };

  const handleSave = () => {
    if (!formData.shift_date) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    // Convert empty string to null for UUID fields
    const dataToSave = {
      ...formData,
      staff_id: formData.staff_id || null,
      shift_time: formData.shift_time || null,
    };

    if (editingNote) {
      // Update existing shift note
      if (editingNote.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          shiftNotes: {
            ...pendingChanges.shiftNotes,
            toAdd: pendingChanges.shiftNotes.toAdd.map(note =>
              note.tempId === editingNote.tempId ? { ...note, ...dataToSave } : note
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          shiftNotes: {
            ...pendingChanges.shiftNotes,
            toUpdate: [
              ...pendingChanges.shiftNotes.toUpdate.filter(n => n.id !== editingNote.id),
              { id: editingNote.id, ...dataToSave },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new shift note
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        shiftNotes: {
          ...pendingChanges.shiftNotes,
          toAdd: [
            ...pendingChanges.shiftNotes.toAdd,
            { tempId, ...dataToSave },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowSheet(false);
  };

  const handleDelete = (note: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (note.tempId) {
      handleCancelPendingAdd(note.tempId);
      return;
    }

    // Otherwise, mark existing shift note for deletion
    if (confirm('Mark this shift note for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        shiftNotes: {
          ...pendingChanges.shiftNotes,
          toDelete: [...pendingChanges.shiftNotes.toDelete, note.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      shiftNotes: {
        ...pendingChanges.shiftNotes,
        toAdd: pendingChanges.shiftNotes.toAdd.filter(note => note.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      shiftNotes: {
        ...pendingChanges.shiftNotes,
        toUpdate: pendingChanges.shiftNotes.toUpdate.filter(note => note.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      shiftNotes: {
        ...pendingChanges.shiftNotes,
        toDelete: pendingChanges.shiftNotes.toDelete.filter(noteId => noteId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Combine existing shift notes with pending adds, filter out pending deletes
  const visibleShiftNotes = [
    ...shiftNotes.filter(note => !pendingChanges?.shiftNotes.toDelete.includes(note.id)),
    ...(pendingChanges?.shiftNotes.toAdd || []),
  ];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,$/g, '');
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData({ ...formData, tags: [...formData.tags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((tag) => tag !== tagToRemove) });
  };

  return (
    <>
      <Card className="pb-2.5" id="shift_notes">
        <CardHeader>
          <CardTitle>Shift Notes</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!participantId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Shift Note
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading shift notes...</div>
          ) : visibleShiftNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No shift notes recorded</div>
          ) : (
            <div className="space-y-4">
              {visibleShiftNotes.map((note) => {
                const isPendingAdd = 'tempId' in note;
                const isPendingUpdate = pendingChanges?.shiftNotes.toUpdate.some(n => n.id === note.id);
                const isPendingDelete = pendingChanges?.shiftNotes.toDelete.includes(note.id);
                
                return (
                  <Card 
                    key={note.id || note.tempId} 
                    className={`border ${
                      isPendingAdd ? 'bg-primary/5 border-primary/20' : 
                      isPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' : 
                      isPendingUpdate ? 'bg-warning/5 border-warning/20' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-muted-foreground" />
                              <span className={`font-medium ${isPendingDelete ? 'line-through' : ''}`}>
                                {new Date(note.shift_date).toLocaleDateString('en-AU', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              {note.shift_time && (
                                <>
                                  <Clock className="size-4 text-muted-foreground ms-2" />
                                  <span className="text-sm text-muted-foreground">
                                    {note.shift_time}
                                  </span>
                                </>
                              )}
                              {isPendingAdd && (
                                <Badge variant="default" className="text-xs ms-2">
                                  Pending add
                                </Badge>
                              )}
                              {isPendingUpdate && (
                                <Badge variant="warning" className="text-xs ms-2">
                                  Pending update
                                </Badge>
                              )}
                              {isPendingDelete && (
                                <Badge variant="destructive" className="text-xs ms-2">
                                  Pending deletion
                                </Badge>
                              )}
                            </div>
                            {note.staff && (
                              <span className="text-xs text-muted-foreground mt-1">
                                By {note.staff.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(note)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(note)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {isPendingAdd && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingAdd(note.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(note.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(note.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                      {note.full_note && (
                        <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${isPendingDelete ? 'line-through' : ''}`}>
                          {note.full_note}
                        </p>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {note.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="sm:max-w-[800px]">
          <SheetHeader>
            <SheetTitle>{editingNote ? 'Edit Shift Note' : 'Add Shift Note'}</SheetTitle>
            <SheetDescription>
              {editingNote
                ? 'Update shift note details'
                : 'Record a new shift note for this participant'}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift_date">Shift Date *</Label>
                <Input
                  id="shift_date"
                  type="date"
                  value={formData.shift_date}
                  onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift_time">Shift Time</Label>
                <Input
                  id="shift_time"
                  type="time"
                  value={formData.shift_time}
                  onChange={(e) => setFormData({ ...formData, shift_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member</Label>
              <Select
                value={formData.staff_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, staff_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select staff member</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_note">Full Note</Label>
              <Textarea
                id="full_note"
                value={formData.full_note}
                onChange={(e) => setFormData({ ...formData, full_note: e.target.value })}
                rows={8}
                placeholder="Detailed shift notes..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Type tag and press Enter or comma"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {formData.tags.length > 0 && (
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
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowSheet(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
