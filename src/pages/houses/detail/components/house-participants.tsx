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
import { useNavigate, Link } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

interface HouseParticipantsProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  readOnly?: boolean;
  pendingChanges?: {
    participants: {
      toAdd: any[];
      toUpdate: any[];
      toDelete: string[];
    }
  };
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
  readOnly = false,
  pendingChanges,
  onPendingChangesChange 
}: HouseParticipantsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);

  const { houseParticipants, loading } = useHouseParticipants(houseId);
  const { participants } = useParticipants();
  const navigate = useNavigate();

  // Helper function to get participant name
  const getParticipantName = (participant: any) => {
    // If it has a direct name (from useHouseParticipants), use it
    if (participant.participant_name) {
      return participant.participant_name;
    }
    // If it has the joined participant object, use that
    if (participant.participant?.participant_name) {
      return participant.participant.participant_name;
    }
    // For pending participants, look up the name from participants list
    if (participant.participant_id) {
      const participantData = participants.find(p => p.id === participant.participant_id);
      return participantData?.participant_name || 'Unknown Participant';
    }
    return 'Unknown Participant';
  };

  // Helper function to get participant initials
  const getParticipantInitials = (participant: any) => {
    const name = getParticipantName(participant);
    return name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get participant photo
  const getParticipantPhoto = (participant: any) => {
    // 1. Check direct photo_url (from listByHouse)
    if (participant.photo_url) return participant.photo_url;
    // 2. Check joined object (alternative database mapping)
    if (participant.participant?.photo_url) return participant.participant.photo_url;
    // 3. Fallback: Lookup in full participants list
    const pId = participant.participant_id || participant.id;
    if (pId) {
      const match = participants.find(p => p.id === pId);
      return match?.photo_url || null;
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

    const participantMember = participants.find(p => p.id === data.participant_id);
    const payload = {
      ...data,
      participant_name: participantMember?.participant_name || undefined,
    };

    if (editingParticipant) {
      // Update existing participant
      if (editingParticipant.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          participants: {
            ...pendingChanges.participants,
            toAdd: pendingChanges.participants.toAdd.map(p =>
              p.tempId === editingParticipant.tempId ? { ...p, ...payload } : p
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
              { id: editingParticipant.id, ...payload },
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
            { tempId, ...payload },
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

  const content = (
    <>
      <CardContent className="px-0">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading participants...</div>
        ) : visibleParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-center text-muted-foreground mb-4">No participants linked to this house</div>
            {!readOnly && (
              <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!houseId || !canAdd}>
                <Plus className="size-4 me-1.5" />
                Add Participant
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Move-in Date</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && (
                  <TableHead className="text-right">
                    <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!houseId || !canAdd}>
                      <Plus className="size-4 me-1.5" />
                      Add Participant
                    </Button>
                  </TableHead>
                )}
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
                      <div className="flex items-center gap-3">
                        <SecureAvatar 
                          src={getParticipantPhoto(participant)} 
                          initials={getParticipantInitials(participant)} 
                          className="size-9 transition-all group-hover:ring-2 group-hover:ring-primary/20"
                          bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS} 
                        />
                        <div className="flex flex-col">
                          <Link 
                            to={`${ROUTES.PARTICIPANT_DETAIL}/${participant.participant_id || participant.id}`}
                            className={`font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors ${isPendingDelete ? 'line-through opacity-50 pointer-events-none' : ''}`}
                          >
                            {getParticipantName(participant)}
                          </Link>
                          <div className="flex items-center gap-1">
                            {isPendingAdd && (
                              <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="size-3" />
                                New
                              </span>
                            )}
                            {isPendingUpdate && (
                              <span className="text-[10px] text-warning font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="size-3" />
                                Updated
                              </span>
                            )}
                            {isPendingDelete && (
                              <span className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="size-3" />
                                Removing
                              </span>
                            )}
                          </div>
                        </div>
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
                    {!readOnly && (
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
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </>
  );

  return (
    <>
      {readOnly ? (
        <div id="participants" className="pb-2.5">
          {content}
        </div>
      ) : (
        <Card className="pb-2.5" id="participants">
          {content}
        </Card>
      )}

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
