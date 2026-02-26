import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useMedicationsMaster } from '@/hooks/useMedicationsMaster';
import { MedicationMaster } from '@/models/medication-master';
import { MedicationMasterQuickAdd } from './medication-master-quick-add';
import { toast } from 'sonner';

interface MedicationMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'name' | 'category' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function MedicationMasterDialog({
  open,
  onClose,
  onUpdate,
}: MedicationMasterDialogProps) {
  const { medications, loading, addMedication, updateMedication, refresh } = useMedicationsMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationMaster | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredMedications = useMemo(() => {
    const filtered = medications.filter((med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.category && med.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'is_active') {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [medications, searchQuery, sortField, sortDirection]);

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
    const { error } = await updateMedication(medication.id, { is_active: newStatus });
    if (error) {
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} medication: ` + error);
    } else {
      toast.success(`Medication ${newStatus ? 'activated' : 'deactivated'} successfully`);
      await refresh();
      onUpdate();
    }
  };

  const handleSave = async (medicationData: Partial<MedicationMaster>) => {
    if (editingMedication) {
      const { error } = await updateMedication(editingMedication.id, medicationData);
      if (error) {
        // Check for duplicate name constraint
        if (error === 'DUPLICATE_NAME') {
          toast.error('Duplicate medication name', {
            description: 'A medication with this name already exists. Please use a different name.'
          });
        } else {
          toast.error('Failed to update medication', {
            description: error
          });
        }
      } else {
        toast.success('Medication updated successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    } else {
      const { error } = await addMedication({
        name: medicationData.name!,
        category: medicationData.category || null,
        common_dosages: medicationData.common_dosages || null,
        side_effects: medicationData.side_effects || null,
        interactions: medicationData.interactions || null,
        is_active: medicationData.is_active ?? true,
        created_by: null,
        updated_by: null,
      });
      if (error) {
        // Check for duplicate name constraint
        if (error === 'DUPLICATE_NAME') {
          toast.error('Duplicate medication name', {
            description: 'A medication with this name already exists. Please use a different name.'
          });
        } else {
          toast.error('Failed to add medication', {
            description: error
          });
        }
      } else {
        toast.success('Medication added successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-4 ms-1 inline opacity-30" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="size-4 ms-1 inline" /> : 
      <ArrowDown className="size-4 ms-1 inline" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col" style={{ zIndex: 60 }}>
          <DialogHeader>
            <DialogTitle>Manage Medication List</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
              <Plus className="size-4 me-1.5" />
              Add Medication
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading medications...</div>
            ) : sortedAndFilteredMedications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No medications found matching your search' : 'No medications available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Medication Name
                      <SortIcon field="name" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('category')}
                    >
                      Category
                      <SortIcon field="category" />
                    </TableHead>
                    <TableHead>Common Dosages</TableHead>
                    <TableHead>General Side Effects</TableHead>
                    <TableHead>Contraindication/Interactions</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('is_active')}
                    >
                      Status
                      <SortIcon field="is_active" />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredMedications.map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell className="font-medium">{medication.name}</TableCell>
                      <TableCell>
                        {medication.category ? (
                          <Badge variant="secondary">{medication.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {medication.common_dosages ? (
                          <span className="text-sm text-muted-foreground">
                            {medication.common_dosages}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {medication.side_effects ? (
                          <span className="text-sm text-muted-foreground max-w-xs truncate block" title={medication.side_effects}>
                            {medication.side_effects}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {medication.interactions ? (
                          <span className="text-sm text-muted-foreground max-w-xs truncate block" title={medication.interactions}>
                            {medication.interactions}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={medication.is_active ? 'success' : 'secondary'}>
                          {medication.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(medication)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(medication)}
                            title={medication.is_active ? 'Deactivate' : 'Activate'}
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
