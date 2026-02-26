import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, Clock, Calendar } from 'lucide-react';
import { useHouseParticipants } from '@/hooks/useHouseParticipants';
import { useParticipants } from '@/hooks/use-participants';
import { ParticipantCombobox } from './participant-combobox';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface HouseParticipantsProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: any;
  onPendingChangesChange?: (changes: any) => void;
}

const participantSchema = z.object({
  participant_id: z.string().min(1, 'Participant is required'),
  move_in_date: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ParticipantFormValues = z.infer<typeof participantSchema>;

export function HouseParticipants({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseParticipantsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { houseParticipants, loading } = useHouseParticipants(houseId);
  const { participants } = useParticipants();
  const navigate = useNavigate();

  // Helper function to get participant name
  const getParticipantName = (participant: any) => {
    // If it has a direct name (from useHouseParticipants), use it
    if (participant.name) {
      return participant.name;
    }
    // If it has the joined participant object, use that
    if (participant.participant?.name) {
      return participant.participant.name;
    }
    // For pending participants, look up the name from participants list
    if (participant.participant_id) {
      const participantData = participants.find(p => p.id === participant.participant_id);
      return participantData?.name || 'Unknown Participant';
    }
    return 'Unknown Participant';
  };

  // Helper function to get participant data
  const getParticipantData = (participant: any) => {
    // If it has a name directly, it's already the participant data
    if (participant.name) {
      return participant;
    }
    // If it has the joined participant object, use that
    if (participant.participant) {
      return participant.participant;
    }
    // For pending participants, look up from participants list
    if (participant.participant_id) {
      return participants.find(p => p.id === participant.participant_id);
    }
    return null;
  };

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      participant_id: '',
      move_in_date: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (showDialog && editingParticipant) {
      form.reset({
        participant_id: editingParticipant.participant_id || editingParticipant.id || '',
        move_in_date: editingParticipant.move_in_date || '',
        is_active: editingParticipant.status === 'active' || editingParticipant.is_active === true,
      });
    } else if (showDialog) {
      form.reset({
        participant_id: '',
        move_in_date: '',
        is_active: true,
      });
    }
  }, [showDialog, editingParticipant, form]);

  const handleAdd = () => {
    setEditingParticipant(null);
    setShowDialog(true);
  };

  const handleEdit = (participant: any) => {
    setEditingParticipant(participant);
    setShowDialog(true);
  };

  const handleSave = (data: ParticipantFormValues) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingParticipant) {
      // Update existing participant
      if (editingParticipant.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          participants: {
            ...pendingChanges.participants,
            toAdd: pendingChanges.participants.toAdd.map(p =>
              p.tempId === editingParticipant.tempId ? { ...p, ...data } : p
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          participants: {
            ...pendingChanges.participants,
            toUpdate: [
              ...pendingChanges.participants.toUpdate.filter(p => p.id !== editingParticipant.id),
              { id: editingParticipant.id, ...data },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new participant
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        participants: {
          ...pendingChanges.participants,
          toAdd: [
            ...pendingChanges.participants.toAdd,
            { tempId, ...data },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (participant: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (participant.tempId) {
      handleCancelPendingAdd(participant.tempId);
      return;
    }

    // Otherwise, mark existing participant for deletion
    if (confirm('Mark this participant for removal? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        participants: {
          ...pendingChanges.participants,
          toDelete: [...pendingChanges.participants.toDelete, participant.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      participants: {
        ...pendingChanges.participants,
        toAdd: pendingChanges.participants.toAdd.filter(p => p.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      participants: {
        ...pendingChanges.participants,
        toUpdate: pendingChanges.participants.toUpdate.filter(p => p.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      participants: {
        ...pendingChanges.participants,
        toDelete: pendingChanges.participants.toDelete.filter(pId => pId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Combine existing participants with pending adds, filter out pending deletes
  const visibleParticipants = [
    ...houseParticipants.filter(p => !pendingChanges?.participants?.toDelete?.includes(p.id)),
    ...(pendingChanges?.participants?.toAdd || []),
  ];

  return (
    <>
      <Card className="pb-2.5" id="participants">
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!houseId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Participant
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading participants...</div>
          ) : visibleParticipants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No participants linked to this house</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Move-in Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleParticipants.map((participant) => {
                  const isPendingAdd = 'tempId' in participant;
                  const pendingUpdate = pendingChanges?.participants?.toUpdate?.find(p => p.id === participant.id);
                  const isPendingUpdate = !!pendingUpdate;
                  const isPendingDelete = pendingChanges?.participants?.toDelete?.includes(participant.id);
                  
                  // Use data from pending update if it exists
                  const displayData = pendingUpdate ? { ...participant, ...pendingUpdate } : participant;
                  
                  return (
                    <TableRow 
                      key={participant.id || participant.tempId} 
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground" />
                          <span 
                            className={`font-medium cursor-pointer text-primary hover:underline ${isPendingDelete ? 'line-through' : ''}`}
                            onClick={() => {
                              const pId = participant.id || participant.participant_id;
                              if (pId && !pId.startsWith('temp-')) {
                                navigate(`/participants/detail/${pId}`);
                              }
                            }}
                          >
                            {getParticipantName(participant)}
                          </span>
                          {isPendingAdd && (
                            <span className="text-xs text-primary flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending add
                            </span>
                          )}
                          {isPendingUpdate && (
                            <span className="text-xs text-warning flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending update
                            </span>
                          )}
                          {isPendingDelete && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending removal
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {displayData.move_in_date && (
                            <>
                              <Calendar className="size-4 text-muted-foreground" />
                              {new Date(displayData.move_in_date).toLocaleDateString()}
                            </>
                          )}
                          {!displayData.move_in_date && 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(displayData.status === 'active' || displayData.is_active) ? 'success' : 'secondary'}>
                          {(displayData.status === 'active' || displayData.is_active) ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(displayData)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(participant)}
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
                              onClick={() => handleCancelPendingAdd(participant.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(participant.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(participant.id)}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingParticipant ? 'Edit Participant' : 'Add Participant to House'}
            </DialogTitle>
            <DialogDescription>
              {editingParticipant 
                ? 'Update the participant details for this house.'
                : 'Select a participant to link to this house.'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="participant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participant *</FormLabel>
                    <FormControl>
                      <ParticipantCombobox
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a participant"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="move_in_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Move-in Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Select move-in date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Participant is currently living in this house
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingParticipant ? 'Update' : 'Add'} Participant
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
