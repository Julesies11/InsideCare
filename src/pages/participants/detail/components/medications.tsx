import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Pill, Clock } from 'lucide-react';
import { MedicationCombobox } from './medication-components/medication-combobox';
import { MedicationMasterDialog } from './medication-components/medication-master-dialog';
import { useParticipantMedications } from '@/hooks/useParticipantMedications';
import { useMedicationsMaster } from '@/hooks/useMedicationsMaster';
import { PendingChanges } from '@/models/pending-changes';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface MedicationsProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
}

const medicationSchema = z.object({
  medication_id: z.string().min(1, 'Medication is required'),
  dosage: z.string().optional().default(''),
  frequency: z.string().optional().default(''),
  is_active: z.boolean().default(true),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

export function Medications({ 
  participantId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: MedicationsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);
  const [showMasterDialog, setShowMasterDialog] = useState(false);
  const [refreshMedicationKey, setRefreshMedicationKey] = useState(0);

  const { medications, loading } = useParticipantMedications(participantId);
  const { medications: medicationsMaster } = useMedicationsMaster();

  // Helper function to get medication name
  const getMedicationName = (med: any) => {
    // If it has the joined medication object, use that
    if (med.medication?.name) {
      return med.medication.name;
    }
    // For pending medications, look up the name from master list
    if (med.medication_id) {
      const masterMed = medicationsMaster.find(m => m.id === med.medication_id);
      return masterMed?.name || 'Unknown Medication';
    }
    return 'Unknown Medication';
  };

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medication_id: '',
      dosage: '',
      frequency: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (showDialog && editingMedication) {
      form.reset({
        medication_id: editingMedication.medication_id,
        dosage: editingMedication.dosage || '',
        frequency: editingMedication.frequency || '',
        is_active: editingMedication.is_active,
      });
    } else if (showDialog) {
      form.reset({
        medication_id: '',
        dosage: '',
        frequency: '',
        is_active: true,
      });
    }
  }, [showDialog, editingMedication, form]);

  const handleAdd = () => {
    setEditingMedication(null);
    setShowDialog(true);
  };

  const handleEdit = (medication: any) => {
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
          medications: {
            ...pendingChanges.medications,
            toAdd: pendingChanges.medications.toAdd.map(med =>
              med.tempId === editingMedication.tempId ? { ...med, ...data } : med
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          medications: {
            ...pendingChanges.medications,
            toUpdate: [
              ...pendingChanges.medications.toUpdate.filter(m => m.id !== editingMedication.id),
              { id: editingMedication.id, ...data },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new medication
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        medications: {
          ...pendingChanges.medications,
          toAdd: [
            ...pendingChanges.medications.toAdd,
            { tempId, ...data },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (medication: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (medication.tempId) {
      handleCancelPendingAdd(medication.tempId);
      return;
    }

    // Otherwise, mark existing medication for deletion
    if (confirm('Mark this medication for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        medications: {
          ...pendingChanges.medications,
          toDelete: [...pendingChanges.medications.toDelete, medication.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      medications: {
        ...pendingChanges.medications,
        toAdd: pendingChanges.medications.toAdd.filter(med => med.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      medications: {
        ...pendingChanges.medications,
        toUpdate: pendingChanges.medications.toUpdate.filter(med => med.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      medications: {
        ...pendingChanges.medications,
        toDelete: pendingChanges.medications.toDelete.filter(medId => medId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Combine existing medications with pending adds, filter out pending deletes
  const visibleMedications = [
    ...medications.filter(med => !pendingChanges?.medications.toDelete.includes(med.id)),
    ...(pendingChanges?.medications.toAdd || []),
  ];

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
          ) : visibleMedications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No medications recorded</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMedications.map((med) => {
                  const isPendingAdd = 'tempId' in med;
                  const isPendingUpdate = pendingChanges?.medications.toUpdate.some(m => m.id === med.id);
                  const isPendingDelete = pendingChanges?.medications.toDelete.includes(med.id);
                  
                  return (
                    <TableRow 
                      key={med.id || med.tempId} 
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Pill className="size-4 text-muted-foreground" />
                          <span className={`font-medium ${isPendingDelete ? 'line-through' : ''}`}>
                            {getMedicationName(med)}
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
                              Pending deletion
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{med.dosage || 'N/A'}</TableCell>
                      <TableCell>{med.frequency || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={med.is_active ? 'success' : 'secondary'}>
                          {med.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(med)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(med)}
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
                              onClick={() => handleCancelPendingAdd(med.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(med.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(med.id)}
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
            <DialogTitle>
              {editingMedication ? 'Edit Medication' : 'Add Medication'}
            </DialogTitle>
            <DialogDescription>
              {editingMedication
                ? 'Update medication details'
                : 'Add a new medication for this participant'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="medication_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name *</FormLabel>
                    <FormControl>
                      <MedicationCombobox
                        value={field.value}
                        onChange={field.onChange}
                        canEdit={canAdd}
                        onManageList={() => setShowMasterDialog(true)}
                        onRefresh={refreshMedicationKey > 0 ? () => {} : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 10mg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Twice daily" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </div>
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

      <MedicationMasterDialog
        open={showMasterDialog}
        onClose={() => {
          setShowMasterDialog(false);
          setRefreshMedicationKey(prev => prev + 1);
        }}
        onUpdate={() => {
          // Refresh will happen automatically via the hook
        }}
      />
    </>
  );
}
