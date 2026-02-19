import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Target, MessageSquarePlus, Clock, ChevronRight, Send, Loader2, Check, X } from 'lucide-react';
import { useParticipantGoals, ParticipantGoal, GoalProgress } from '@/hooks/useParticipantGoals';
import { ParticipantPendingChanges } from '@/models/participant-pending-changes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';

interface GoalsProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: ParticipantPendingChanges;
  onPendingChangesChange?: (changes: ParticipantPendingChanges) => void;
}

const goalSchema = z.object({
  goal_type: z.enum(['ndis', 'identified']),
  description: z.string().min(1, 'Goal description is required'),
});

type GoalFormValues = z.infer<typeof goalSchema>;

function ProgressNoteItem({
  note,
  onEdit,
  onDelete,
  canEdit,
}: {
  note: GoalProgress;
  onEdit: (id: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.progress_note);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === note.progress_note) { setEditing(false); return; }
    setSaving(true);
    await onEdit(note.id, trimmed);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this progress note?')) return;
    setDeleting(true);
    await onDelete(note.id);
    setDeleting(false);
  };

  const handleCancelEdit = () => {
    setEditText(note.progress_note);
    setEditing(false);
  };

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 group">
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={saving}>
              <X className="size-3.5" />
            </Button>
            <Button size="sm" variant="primary" onClick={handleSaveEdit} disabled={saving || !editText.trim()}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm whitespace-pre-wrap">{note.progress_note}</p>
            {note.created_at && (
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="inline size-3 me-1" />
                {format(new Date(note.created_at), 'dd MMM yyyy, h:mm a')}
                {note.updated_at && note.updated_at !== note.created_at && (
                  <span className="ml-1 italic">(edited)</span>
                )}
              </p>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => { setEditText(note.progress_note); setEditing(true); }}
              >
                <Edit className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressNotesList({
  notes,
  goalId,
  onAddNote,
  onEditNote,
  onDeleteNote,
  canAdd,
}: {
  notes: GoalProgress[];
  goalId: string;
  onAddNote: (goalId: string, text: string) => Promise<void>;
  onEditNote: (id: string, text: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  canAdd: boolean;
}) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    setSaving(true);
    await onAddNote(goalId, trimmed);
    setNoteText('');
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No progress notes yet</p>
        ) : (
          notes.map((note) => (
            <ProgressNoteItem
              key={note.id}
              note={note}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              canEdit={canAdd}
            />
          ))
        )}
      </div>
      {canAdd && (
        <div className="flex gap-2 pt-1">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a progress note..."
            rows={2}
            className="flex-1 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <Button
            size="sm"
            variant="primary"
            className="self-end"
            onClick={handleSubmit}
            disabled={saving || !noteText.trim()}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export function Goals({
  participantId,
  canAdd,
  canDelete,
  pendingChanges,
  onPendingChangesChange,
}: GoalsProps) {
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ParticipantGoal | null>(null);

  // Option B: Sheet state — selected goal for side panel
  const [sheetGoal, setSheetGoal] = useState<ParticipantGoal | null>(null);

  // Option D: Progress dialog state — selected goal for focused progress dialog
  const [progressDialogGoal, setProgressDialogGoal] = useState<ParticipantGoal | null>(null);

  const { goals, goalProgress, loading, addProgress, updateProgress, deleteProgress } = useParticipantGoals(participantId);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_type: 'identified',
      description: '',
    },
  });

  useEffect(() => {
    if (showGoalDialog && editingGoal) {
      form.reset({
        goal_type: editingGoal.goal_type,
        description: editingGoal.description,
      });
    } else if (showGoalDialog) {
      form.reset({
        goal_type: 'identified',
        description: '',
      });
    }
  }, [showGoalDialog, editingGoal, form]);

  const handleAdd = () => {
    setEditingGoal(null);
    setShowGoalDialog(true);
  };

  const handleEdit = (goal: ParticipantGoal) => {
    setEditingGoal(goal);
    setShowGoalDialog(true);
  };

  const handleSave = (data: GoalFormValues) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingGoal) {
      if (editingGoal.tempId) {
        const newPending = {
          ...pendingChanges,
          goals: {
            ...pendingChanges.goals,
            toAdd: pendingChanges.goals.toAdd.map(g =>
              g.tempId === editingGoal.tempId ? { ...g, ...data } : g
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        const newPending = {
          ...pendingChanges,
          goals: {
            ...pendingChanges.goals,
            toUpdate: [
              ...pendingChanges.goals.toUpdate.filter(g => g.id !== editingGoal.id),
              { id: editingGoal.id, ...data },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        goals: {
          ...pendingChanges.goals,
          toAdd: [
            ...pendingChanges.goals.toAdd,
            { tempId, ...data },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowGoalDialog(false);
  };

  const handleDelete = (goal: ParticipantGoal) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (goal.tempId) {
      handleCancelPendingAdd(goal.tempId);
      return;
    }

    if (confirm('Mark this goal for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        goals: {
          ...pendingChanges.goals,
          toDelete: [...pendingChanges.goals.toDelete, goal.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      goals: {
        ...pendingChanges.goals,
        toAdd: pendingChanges.goals.toAdd.filter(g => g.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      goals: {
        ...pendingChanges.goals,
        toUpdate: pendingChanges.goals.toUpdate.filter(g => g.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      goals: {
        ...pendingChanges.goals,
        toDelete: pendingChanges.goals.toDelete.filter(gId => gId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleAddNote = async (goalId: string, text: string) => {
    await addProgress({ goal_id: goalId, progress_note: text });
  };

  const handleEditNote = async (id: string, text: string) => {
    await updateProgress(id, text);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteProgress(id);
  };

  const visibleGoals = [
    ...goals.filter(g => !pendingChanges?.goals.toDelete.includes(g.id)),
    ...(pendingChanges?.goals.toAdd || []),
  ];

  const sheetNotes = sheetGoal ? goalProgress.filter(p => p.goal_id === sheetGoal.id) : [];
  const progressDialogNotes = progressDialogGoal ? goalProgress.filter(p => p.goal_id === progressDialogGoal.id) : [];

  return (
    <>
      <Card className="pb-2.5" id="goals">
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!participantId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading goals...</div>
          ) : visibleGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No goals recorded</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleGoals.map((goal) => {
                  const isPendingAdd = 'tempId' in goal;
                  const isPendingUpdate = pendingChanges?.goals.toUpdate.some(g => g.id === goal.id);
                  const isPendingDelete = pendingChanges?.goals.toDelete.includes(goal.id);
                  const noteCount = goalProgress.filter(p => p.goal_id === goal.id).length;
                  const isSaved = !isPendingAdd;

                  return (
                    <TableRow
                      key={goal.id || goal.tempId}
                      className={
                        isPendingAdd ? 'bg-primary/5' :
                        isPendingDelete ? 'opacity-50 bg-destructive/5' :
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="size-4 text-muted-foreground" />
                          <span className={`font-medium ${isPendingDelete ? 'line-through' : ''}`}>
                            {goal.goal_type === 'ndis' ? 'NDIS' : 'Identified'}
                          </span>
                        </div>
                      </TableCell>
                      {/* Option B trigger: click description to open Sheet */}
                      <TableCell>
                        {isSaved ? (
                          <button
                            type="button"
                            className="text-left hover:underline focus:outline-none group flex items-center gap-1"
                            onClick={() => setSheetGoal(goal as ParticipantGoal)}
                          >
                            <span className={isPendingDelete ? 'line-through' : ''}>{goal.description}</span>
                            <ChevronRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span>{goal.description}</span>
                        )}
                      </TableCell>
                      {/* Option D: badge showing note count */}
                      <TableCell>
                        {isSaved ? (
                          <button
                            type="button"
                            onClick={() => setProgressDialogGoal(goal as ParticipantGoal)}
                            className="focus:outline-none"
                          >
                            <Badge
                              variant={noteCount > 0 ? 'secondary' : 'outline'}
                              className="cursor-pointer hover:bg-secondary/80 transition-colors gap-1"
                            >
                              <MessageSquarePlus className="size-3" />
                              {noteCount > 0 ? `${noteCount} note${noteCount !== 1 ? 's' : ''}` : 'Add notes'}
                            </Badge>
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Save goal first</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(goal)}
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
                              onClick={() => handleCancelPendingAdd(goal.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(goal.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(goal.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update goal details and add progress notes' : 'Add a new goal for this participant'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="goal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Type *</FormLabel>
                    <FormControl>
                      <select {...field} className="border rounded-md w-full p-2">
                        <option value="ndis">NDIS</option>
                        <option value="identified">Identified</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Description *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Describe the goal..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Progress notes — only for saved goals */}
              {editingGoal && !editingGoal.tempId ? (
                <div className="pt-1">
                  <p className="text-sm font-medium mb-2">Progress Notes</p>
                  <ProgressNotesList
                    notes={goalProgress.filter(p => p.goal_id === editingGoal.id)}
                    goalId={editingGoal.id}
                    onAddNote={handleAddNote}
                    onEditNote={handleEditNote}
                    onDeleteNote={handleDeleteNote}
                    canAdd={canAdd}
                  />
                </div>
              ) : !editingGoal ? (
                <p className="text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/40">
                  Progress notes can be added after the goal is saved.
                </p>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowGoalDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Option B: Goal detail Sheet (right side panel) */}
      <Sheet open={!!sheetGoal} onOpenChange={(open) => { if (!open) setSheetGoal(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {sheetGoal?.goal_type === 'ndis' ? 'NDIS Goal' : 'Identified Goal'}
              </Badge>
            </div>
            <SheetTitle className="mt-2 text-base leading-snug">{sheetGoal?.description}</SheetTitle>
            <SheetDescription>
              Progress notes — {sheetNotes.length} {sheetNotes.length === 1 ? 'entry' : 'entries'}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="flex-1 overflow-y-auto px-6 py-4">
            {sheetGoal && (
              <ProgressNotesList
                notes={sheetNotes}
                goalId={sheetGoal.id}
                onAddNote={handleAddNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                canAdd={canAdd}
              />
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Option D: Focused progress notes Dialog */}
      <Dialog open={!!progressDialogGoal} onOpenChange={(open) => { if (!open) setProgressDialogGoal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="size-4 text-muted-foreground" />
              Progress Notes
            </DialogTitle>
            <DialogDescription className="line-clamp-2">
              {progressDialogGoal?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {progressDialogGoal && (
              <ProgressNotesList
                notes={progressDialogNotes}
                goalId={progressDialogGoal.id}
                onAddNote={handleAddNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                canAdd={canAdd}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}