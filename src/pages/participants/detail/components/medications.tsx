import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Pill } from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { MedicationCombobox } from './medication-components/medication-combobox';
import { useParticipantMedications } from '@/hooks/use-participant-medications';
import { useMedicationsMaster } from '@/hooks/use-medications-master';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface MedicationPendingChanges {
  toAdd: any[];
  toUpdate: any[];
  toDelete: string[];
}

interface MedicationsProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  canEdit: boolean;
  pendingChanges?: MedicationPendingChanges;
  onPendingChangesChange?: (changes: MedicationPendingChanges) => void;
  refreshTrigger?: number;
}

const medicationSchema = z.object({
  medication_id: z.string().min(1, 'Medication is required'),
  is_active: z.boolean().default(true),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

export function Medications({ 
  participantId, 
  canAdd, 
  canDelete,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
  refreshTrigger,
}: MedicationsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<{ id?: string; tempId?: string; medication_id: string; is_active: boolean } | null>(null);

  const { data: medications = [], isLoading: loading, refetch } = useParticipantMedications(participantId);
  const { medications: medicationsMaster = [] } = useMedicationsMaster();

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medication_id: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (showDialog && editingMedication) {
      form.reset({
        medication_id: editingMedication.medication_id,
        is_active: editingMedication.is_active,
      });
    } else if (showDialog) {
      form.reset({
        medication_id: '',
        is_active: true,
      });
    }
  }, [showDialog, editingMedication, form]);

  const handleAdd = () => {
    setEditingMedication(null);
    setShowDialog(true);
  };

  const handleEdit = (medication: { id?: string; tempId?: string; medication_id: string; is_active: boolean }) => {
    setEditingMedication(medication);
    setShowDialog(true);
  };

  const handleSave = (data: MedicationFormValues) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingMedication) {
      // Update existing medication
      if (editingMedication.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          toAdd: pendingChanges.toAdd.map(med =>
            med.tempId === editingMedication.tempId ? { ...med, ...data } : med
          ),
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          toUpdate: [
            ...pendingChanges.toUpdate.filter(m => m.id !== editingMedication.id),
            { id: editingMedication.id, ...data },
          ],
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new medication
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        toAdd: [
          ...pendingChanges.toAdd,
          { tempId, ...data },
        ],
      };
      onPendingChangesChange(newPending);
    }

    setShowDialog(false);
  };

  const handleDelete = (medication: { id?: string; tempId?: string; medication_id: string }) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (medication.tempId) {
      // Remove from pending add
      const newPending = {
        ...pendingChanges,
        toAdd: pendingChanges.toAdd.filter(m => m.tempId !== medication.tempId),
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (confirm('Mark this medication for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        toDelete: [...pendingChanges.toDelete, medication.id!],
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      toUpdate: pendingChanges.toUpdate.filter(m => m.id !== id),
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      toDelete: pendingChanges.toDelete.filter(medId => medId !== id),
    };
    onPendingChangesChange(newPending);
  };

  // Combine actual and pending medications
  const visibleMedications = medications
    .filter(m => !pendingChanges?.toDelete.includes(m.id))
    .map(m => {
      const update = pendingChanges?.toUpdate.find(u => u.id === m.id);
      return update ? { ...m, ...update, isPendingUpdate: true } : m;
    });

  const allMedications = [
    ...visibleMedications,
    ...(pendingChanges?.toAdd.map(m => ({ ...m, isPendingAdd: true })) || []),
  ];

  const getMedicationName = (id: string) => {
    return medicationsMaster.find(m => m.id === id)?.medication_name || 'Unknown Medication';
  };

  const getMedicationType = (id: string) => {
    const med = medicationsMaster.find(m => m.id === id);
    return (med as any)?.medication_type?.medication_type_name || '—';
  };

  return (
    <>
      <Card className="pb-2.5" id="medications">
        <CardHeader>
          <CardTitle>Medications</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!participantId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Medication
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading medications...</div>
          ) : allMedications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No medications recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMedications.map((med) => {
                  const isPendingDelete = !med.isPendingAdd && pendingChanges?.toDelete.includes(med.id);
                  const isPendingUpdate = med.isPendingUpdate;
                  const isPendingAdd = med.isPendingAdd;

                  return (
                    <TableRow 
                      key={med.id || med.tempId}
                      className={cn(
                        isPendingAdd && 'bg-primary/5',
                        isPendingUpdate && 'bg-warning/5',
                        isPendingDelete && 'opacity-50 grayscale bg-red-50'
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Pill className="size-4 text-muted-foreground" />
                          <Link 
                            to={`${ROUTES.MEDICATION_REGISTER}/${med.medication_id}`}
                            className={cn(
                              "text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors",
                              isPendingDelete && 'line-through opacity-50 pointer-events-none'
                            )}
                          >
                            {getMedicationName(med.medication_id)}
                          </Link>
                          {isPendingAdd && <Badge variant="outline" className="text-[10px] uppercase">New</Badge>}
                          {isPendingUpdate && <Badge variant="outline" className="text-[10px] uppercase border-warning text-warning">Pending Update</Badge>}
                          {isPendingDelete && <Badge variant="destructive" className="text-[10px] uppercase">Pending Delete</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className={cn(isPendingDelete && 'text-muted-foreground line-through')}>
                        {getMedicationType(med.medication_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={med.is_active ? 'success' : 'secondary'}>
                          {med.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && !isPendingAdd && !isPendingUpdate && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(med)} disabled={!canEdit}>
                                <Edit className="size-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(med)} disabled={!canDelete}>
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                          {isPendingAdd && (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(med)}>
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(med.id)}
                              disabled={!canEdit}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(med.id)}
                              disabled={!canDelete}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMedication ? 'Edit Medication' : 'Add Medication'}</DialogTitle>
            <DialogDescription>
              {editingMedication ? 'Update medication details' : 'Add a new medication for this participant'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="medication_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication *</FormLabel>
                    <FormControl>
                      <MedicationCombobox
                        value={field.value}
                        onChange={field.onChange}
                        canEdit={canEdit}
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
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <DialogDescription>
                        Is the participant currently taking this?
                      </DialogDescription>
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
                  {editingMedication ? 'Update Queue' : 'Add to Queue'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
