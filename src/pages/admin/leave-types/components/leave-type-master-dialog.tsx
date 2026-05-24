import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useLeaveTypesMaster, useAddLeaveTypeMaster, useUpdateLeaveTypeMaster } from '@/hooks/use-leave-types-master';
import { LeaveTypeMaster } from '@/models/leave-type-master';
import { LeaveTypeMasterQuickAdd } from './leave-type-master-quick-add';
import { toast } from 'sonner';

interface LeaveTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'leave_type_name' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function LeaveTypeMasterDialog({
  open,
  onClose,
  onUpdate,
}: LeaveTypeMasterDialogProps) {
  const { data: leaveTypes = [], isLoading: loading } = useLeaveTypesMaster();
  const { mutateAsync: addLeaveType } = useAddLeaveTypeMaster();
  const { mutateAsync: updateLeaveType } = useUpdateLeaveTypeMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeMaster | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('leave_type_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredLeaveTypes = useMemo(() => {
    const filtered = leaveTypes.filter((lt) =>
      lt.leave_type_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField] || '';
      let bVal: string | number = b[sortField] || '';

      if (sortField === 'is_active') {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [leaveTypes, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingLeaveType(null);
    setShowAddDialog(true);
  };

  const handleEdit = (leaveType: LeaveTypeMaster) => {
    setEditingLeaveType(leaveType);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (leaveType: LeaveTypeMaster) => {
    const newStatus = !leaveType.is_active;
    try {
      await updateLeaveType({ id: leaveType.id, updates: { is_active: newStatus }, oldLeaveType: leaveType });
      toast.success(`Leave type ${newStatus ? 'activated' : 'deactivated'} successfully`);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} leave type: ` + err.message);
    }
  };

  const handleSave = async (leaveTypeData: Partial<LeaveTypeMaster>) => {
    try {
      if (editingLeaveType) {
        await updateLeaveType({ id: editingLeaveType.id, updates: leaveTypeData, oldLeaveType: editingLeaveType });
        toast.success('Leave type updated successfully');
      } else {
        await addLeaveType({
          leave_type_name: leaveTypeData.leave_type_name!,
          is_active: leaveTypeData.is_active ?? true,
        });
        toast.success('Leave type added successfully');
      }
      setShowAddDialog(false);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      if (err.message === 'DUPLICATE_NAME') {
        toast.error('Duplicate leave type name', {
          description: 'A leave type with this name already exists. Please use a different name.'
        });
      } else {
        toast.error(`Failed to ${editingLeaveType ? 'update' : 'add'} leave type`, {
          description: err.message
        });
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
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col" style={{ zIndex: 60 }}>
          <DialogHeader>
            <DialogTitle>Manage Leave Type List</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search leave types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
              <Plus className="size-4 me-1.5" />
              Add Leave Type
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading leave types...</div>
            ) : sortedAndFilteredLeaveTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No leave types found matching your search' : 'No leave types available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('leave_type_name')}
                    >
                      Leave Type Name
                      <SortIcon field="leave_type_name" />
                    </TableHead>
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
                  {sortedAndFilteredLeaveTypes.map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.leave_type_name}</TableCell>
                      <TableCell>
                        <Badge variant={lt.is_active ? 'success' : 'secondary'}>
                          {lt.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(lt)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(lt)}
                            title={lt.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {lt.is_active ? 'Deactivate' : 'Activate'}
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

      <LeaveTypeMasterQuickAdd
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingLeaveType(null);
        }}
        onSave={handleSave}
        editingLeaveType={editingLeaveType}
      />
    </>
  );
}
