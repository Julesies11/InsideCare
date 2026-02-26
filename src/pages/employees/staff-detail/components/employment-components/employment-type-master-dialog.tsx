import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useEmploymentTypesMaster, EmploymentType } from '@/hooks/useEmploymentTypesMaster';
import { EmploymentTypeMasterQuickAdd } from './employment-type-master-quick-add';
import { toast } from 'sonner';

interface EmploymentTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'name' | 'description' | 'status';
type SortDirection = 'asc' | 'desc';

export function EmploymentTypeMasterDialog({
  open,
  onClose,
  onUpdate,
}: EmploymentTypeMasterDialogProps) {
  const { employmentTypes, loading, addEmploymentType, updateEmploymentType, refresh } = useEmploymentTypesMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmploymentType, setEditingEmploymentType] = useState<EmploymentType | null>(null);
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

  const sortedAndFilteredEmploymentTypes = useMemo(() => {
    const filtered = employmentTypes.filter((type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'status') {
        aVal = a.status === 'Active' ? 1 : 0;
        bVal = b.status === 'Active' ? 1 : 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employmentTypes, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingEmploymentType(null);
    setShowAddDialog(true);
  };

  const handleEdit = (employmentType: EmploymentType) => {
    setEditingEmploymentType(employmentType);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (employmentType: EmploymentType) => {
    const newStatus = employmentType.status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await updateEmploymentType(employmentType.id, { status: newStatus });
    if (error) {
      toast.error(`Failed to ${newStatus === 'Active' ? 'activate' : 'deactivate'} employment type: ` + error);
    } else {
      toast.success(`Employment type ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
      await refresh();
      onUpdate();
    }
  };

  const handleSave = async (employmentTypeData: Partial<EmploymentType>) => {
    if (editingEmploymentType) {
      const { error } = await updateEmploymentType(editingEmploymentType.id, employmentTypeData);
      if (error) {
        toast.error('Failed to update employment type: ' + error);
      } else {
        toast.success('Employment type updated successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    } else {
      const { error } = await addEmploymentType(employmentTypeData as Omit<EmploymentType, 'id' | 'created_at' | 'updated_at'>);
      if (error) {
        toast.error('Failed to add employment type: ' + error);
      } else {
        toast.success('Employment type added successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="size-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Employment Types</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Search employment types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd}>
              <Plus className="size-4 me-2" />
              Add Employment Type
            </Button>
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-8 px-2"
                    >
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('description')}
                      className="h-8 px-2"
                    >
                      Description
                      {getSortIcon('description')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-8 px-2"
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredEmploymentTypes.map((employmentType) => (
                  <TableRow key={employmentType.id}>
                    <TableCell className="font-medium">{employmentType.name}</TableCell>
                    <TableCell>{employmentType.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={employmentType.status === 'Active' ? 'success' : 'secondary'}>
                        {employmentType.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(employmentType)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(employmentType)}
                        >
                          {employmentType.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <EmploymentTypeMasterQuickAdd
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSave}
        employmentType={editingEmploymentType}
      />
    </>
  );
}
