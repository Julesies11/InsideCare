import { useState } from 'react';
import { MedicationMaster } from '@/models/medication-master';
import { Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddMedicationMaster,
  useMedicationsMaster,
  useUpdateMedicationMaster,
} from '@/hooks/use-medications-master';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortIcon } from '@/components/common/sort-icon';
import { MedicationMasterQuickAdd } from './medication-master-quick-add';

interface MedicationMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'medication_name' | 'brand_name' | 'type_id' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function MedicationMasterDialog({
  open,
  onClose,
  onUpdate,
}: MedicationMasterDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('medication_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 50;

  const {
    medications = [],
    count = 0,
    isLoading: loading,
  } = useMedicationsMaster(
    pageIndex,
    pageSize,
    [{ id: sortField, desc: sortDirection === 'desc' }],
    { search: searchQuery, includeInactive: true },
  );

  const { mutateAsync: addMedication } = useAddMedicationMaster();
  const { mutateAsync: updateMedication } = useUpdateMedicationMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMedication, setEditingMedication] =
    useState<MedicationMaster | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPageIndex(0);
  };

  const handleAdd = () => {
    setEditingMedication(null);
    setShowAddDialog(true);
  };

  const handleEdit = (medication: MedicationMaster) => {
    setEditingMedication(medication);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (medication: MedicationMaster) => {
    const newStatus = !medication.is_active;
    try {
      await updateMedication({
        id: medication.id,
        updates: { is_active: newStatus },
        oldMedication: medication,
      });
      toast.success(
        `Medication ${newStatus ? 'activated' : 'deactivated'} successfully`,
      );
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(
        `Failed to ${newStatus ? 'activate' : 'deactivate'} medication: ` +
          err.message,
      );
    }
  };

  const handleSave = async (medicationData: Partial<MedicationMaster>) => {
    try {
      if (editingMedication) {
        await updateMedication({
          id: editingMedication.id,
          updates: medicationData,
          oldMedication: editingMedication,
        });
        toast.success('Medication updated successfully');
      } else {
        await addMedication({
          medication_name: medicationData.medication_name!,
          brand_name: medicationData.brand_name || null,
          type_id: medicationData.type_id!,
          sub_class: medicationData.sub_class || null,
          side_effects: medicationData.side_effects || null,
          interactions: medicationData.interactions || null,
          is_active: medicationData.is_active ?? true,
        });
        toast.success('Medication added successfully');
      }
      setShowAddDialog(false);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      if (err.message === 'DUPLICATE_NAME') {
        toast.error('Duplicate medication name', {
          description:
            'A medication with this name already exists. Please use a different name.',
        });
      } else {
        toast.error(
          `Failed to ${editingMedication ? 'update' : 'add'} medication`,
          {
            description: err.message,
          },
        );
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-4xl h-[80vh] flex flex-col"
          style={{ zIndex: 60 }}
        >
          <DialogHeader>
            <DialogTitle>Manage Medication List</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search by Generic, Brand, or Side Effects..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPageIndex(0);
              }}
              className="max-w-xs"
            />
            <Button
              variant="secondary"
              size="sm"
              className="border border-gray-300"
              onClick={handleAdd}
            >
              <Plus className="size-4 me-1.5" />
              Add Medication
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading medications...
              </div>
            ) : medications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? 'No medications found matching your search'
                  : 'No medications available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('medication_name')}
                    >
                      Generic Name
                      <SortIcon
                        field="medication_name"
                        currentField={sortField}
                        direction={sortDirection}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('brand_name')}
                    >
                      Brand Name
                      <SortIcon
                        field="brand_name"
                        currentField={sortField}
                        direction={sortDirection}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('type_id')}
                    >
                      Type
                      <SortIcon
                        field="type_id"
                        currentField={sortField}
                        direction={sortDirection}
                      />
                    </TableHead>
                    <TableHead>General Side Effects</TableHead>
                    <TableHead>Contraindication/Interactions</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('is_active')}
                    >
                      Status
                      <SortIcon
                        field="is_active"
                        currentField={sortField}
                        direction={sortDirection}
                      />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell className="font-medium">
                        {medication.medication_name}
                      </TableCell>
                      <TableCell>{medication.brand_name || '-'}</TableCell>
                      <TableCell>
                        {(medication as any).medication_type
                          ?.medication_type_name ? (
                          <Badge variant="secondary">
                            {
                              (medication as any).medication_type
                                .medication_type_name
                            }
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {medication.side_effects ? (
                          <span
                            className="text-sm text-muted-foreground max-w-xs truncate block"
                            title={medication.side_effects}
                          >
                            {medication.side_effects}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {medication.interactions ? (
                          <span
                            className="text-sm text-muted-foreground max-w-xs truncate block"
                            title={medication.interactions}
                          >
                            {medication.interactions}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            medication.is_active ? 'success' : 'secondary'
                          }
                        >
                          {medication.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(medication)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(medication)}
                            title={
                              medication.is_active ? 'Deactivate' : 'Activate'
                            }
                          >
                            {medication.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t mt-auto">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MedicationMasterQuickAdd
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingMedication(null);
        }}
        onSave={handleSave}
        editingMedication={editingMedication}
      />
    </>
  );
}
