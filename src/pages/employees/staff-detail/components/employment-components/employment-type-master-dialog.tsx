import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useEmploymentTypesMaster, useAddEmploymentTypeMaster, useUpdateEmploymentTypeMaster, EmploymentType } from '@/hooks/use-employment-types-master';
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
  const { data: employmentTypes = [], isLoading: loading } = useEmploymentTypesMaster();
  const { mutateAsync: addEmploymentType } = useAddEmploymentTypeMaster();
  const { mutateAsync: updateEmploymentType } = useUpdateEmploymentTypeMaster();
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
    try {
      await updateEmploymentType({ id: employmentType.id, updates: { status: newStatus } });
      toast.success(`Employment type ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
      onUpdate();
    } catch (error: any) {
      toast.error(`Failed to ${newStatus === 'Active' ? 'activate' : 'deactivate'} employment type: ` + error.message);
    }
  };

  const handleSave = async (employmentTypeData: Partial<EmploymentType>) => {
    try {
      if (editingEmploymentType) {
        await updateEmploymentType({ id: editingEmploymentType.id, updates: employmentTypeData });
        toast.success('Employment type updated successfully');
      } else {
        await addEmploymentType({
          name: employmentTypeData.name!,
          description: employmentTypeData.description || null,
          status: employmentTypeData.status || 'Active',
        });
        toast.success('Employment type added successfully');
      }
      setShowAddDialog(false);
      onUpdate();
    } catch (error: any) {
      toast.error(`Failed to ${editingEmploymentType ? 'update' : 'add'} employment type: ` + error.message);
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
