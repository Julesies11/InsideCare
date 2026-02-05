import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Target, Clock } from 'lucide-react';
import { useParticipantGoals, ParticipantGoal, GoalProgress } from '@/hooks/useParticipantGoals';
import { PendingChanges } from '@/models/pending-changes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface GoalsProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
}

const goalSchema = z.object({
  goal_type: z.enum(['ndis', 'identified']),
  description: z.string().min(1, 'Goal description is required'),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export function Goals({
  participantId,
  canAdd,
  canDelete,
  pendingChanges,
  onPendingChangesChange,
}: GoalsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ParticipantGoal | null>(null);

  const { goals, goalProgress, loading } = useParticipantGoals(participantId);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_type: 'identified',
      description: '',
    },
  });

  useEffect(() => {
    if (showDialog && editingGoal) {
      form.reset({
        goal_type: editingGoal.goal_type,
        description: editingGoal.description,
      });
    } else if (showDialog) {
      form.reset({
        goal_type: 'identified',
        description: '',
      });
    }
  }, [showDialog, editingGoal, form]);

  const handleAdd = () => {
    setEditingGoal(null);
    setShowDialog(true);
  };

  const handleEdit = (goal: ParticipantGoal) => {
    setEditingGoal(goal);
    setShowDialog(true);
  };

  const handleSave = (data: GoalFormValues) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingGoal) {
      // Update existing goal
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
      // Add new goal
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
    setShowDialog(false);
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

  const visibleGoals = [
    ...goals.filter(g => !pendingChanges?.goals.toDelete.includes(g.id)),
    ...(pendingChanges?.goals.toAdd || []),
  ];

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
                  <TableHead>Progress Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleGoals.map((goal) => {
                  const isPendingAdd = 'tempId' in goal;
                  const isPendingUpdate = pendingChanges?.goals.toUpdate.some(g => g.id === goal.id);
                  const isPendingDelete = pendingChanges?.goals.toDelete.includes(goal.id);

                  const progressNotes = goalProgress.filter(p => p.goal_id === goal.id);

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
                      <TableCell>{goal.description}</TableCell>
                      <TableCell>
                        {progressNotes.length === 0
                          ? <span className="text-muted-foreground">No progress</span>
                          : progressNotes.map((p, idx) => (
                              <div key={p.id || idx} className="text-sm mb-1">
                                {p.progress_note}
                              </div>
                            ))
                        }
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update goal details' : 'Add a new goal for this participant'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}