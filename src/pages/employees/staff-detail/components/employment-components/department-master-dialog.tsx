import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Department,
  useAddDepartmentMaster,
  useDepartmentsMaster,
  useUpdateDepartmentMaster,
} from '@/hooks/use-departments-master';
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
import { DepartmentMasterQuickAdd } from './department-master-quick-add';

interface DepartmentMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'department_name' | 'description' | 'status';
type SortDirection = 'asc' | 'desc';

export function DepartmentMasterDialog({
  open,
  onClose,
  onUpdate,
}: DepartmentMasterDialogProps) {
  const { data: departments = [] } = useDepartmentsMaster();
  const { mutateAsync: addDepartment } = useAddDepartmentMaster();
  const { mutateAsync: updateDepartment } = useUpdateDepartmentMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
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

  const sortedAndFilteredDepartments = useMemo(() => {
    const filtered = departments.filter(
      (dept) =>
        dept.department_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (dept.description &&
          dept.description.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField] || '';
      let bVal: string | number = b[sortField] || '';

      if (sortField === 'status') {
        aVal = a.status === 'Active' ? 1 : 0;
        bVal = b.status === 'Active' ? 1 : 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [departments, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingDepartment(null);
    setShowAddDialog(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (department: Department) => {
    const newStatus = department.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateDepartment({
        id: department.id,
        updates: { status: newStatus },
      });
      toast.success(
        `Department ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`,
      );
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(
        `Failed to ${newStatus === 'Active' ? 'activate' : 'deactivate'} department: ` +
          err.message,
      );
    }
  };

  const handleSave = async (departmentData: Partial<Department>) => {
    try {
      if (editingDepartment) {
        await updateDepartment({
          id: editingDepartment.id,
          updates: departmentData,
        });
        toast.success('Department updated successfully');
      } else {
        await addDepartment(
          departmentData as Omit<
            Department,
            'id' | 'created_at' | 'updated_at'
          >,
        );
        toast.success('Department added successfully');
      }
      setShowAddDialog(false);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(
        `Failed to ${editingDepartment ? 'update' : 'add'} department: ` +
          err.message,
      );
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="size-4" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-4" />
    ) : (
      <ArrowDown className="size-4" />
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Departments</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd}>
              <Plus className="size-4 me-2" />
              Add Department
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
                      onClick={() => handleSort('department_name')}
                      className="h-8 px-2"
                    >
                      Name
                      {getSortIcon('department_name')}
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
                {sortedAndFilteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">
                      {department.department_name}
                    </TableCell>
                    <TableCell>{department.description || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          department.status === 'Active'
                            ? 'success'
                            : 'secondary'
                        }
                      >
                        {department.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(department)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(department)}
                        >
                          {department.status === 'Active'
                            ? 'Deactivate'
                            : 'Activate'}
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

      <DepartmentMasterQuickAdd
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSave}
        department={editingDepartment}
      />
    </>
  );
}
