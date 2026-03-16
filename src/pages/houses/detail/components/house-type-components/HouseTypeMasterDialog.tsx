import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { HouseType } from '@/models/house';
import { useHouseTypesMaster, useAddHouseTypeMaster, useUpdateHouseTypeMaster } from '@/hooks/use-house-types-master';
import { HouseTypeMasterQuickAdd } from './HouseTypeMasterQuickAdd';
import { toast } from 'sonner';

interface HouseTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'name' | 'description' | 'status';
type SortDirection = 'asc' | 'desc';

export function HouseTypeMasterDialog({
  open,
  onClose,
  onUpdate,
}: HouseTypeMasterDialogProps) {
  const { data: houseTypes = [] } = useHouseTypesMaster();
  const { mutateAsync: addHouseType } = useAddHouseTypeMaster();
  const { mutateAsync: updateHouseType } = useUpdateHouseTypeMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHouseType, setEditingHouseType] = useState<HouseType | null>(null);
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

  const sortedAndFilteredHouseTypes = useMemo(() => {
    const filtered = houseTypes.filter((type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
  }, [houseTypes, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingHouseType(null);
    setShowAddDialog(true);
  };

  const handleEdit = (houseType: HouseType) => {
    setEditingHouseType(houseType);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (houseType: HouseType) => {
    const newStatus = houseType.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateHouseType({ id: houseType.id, updates: { status: newStatus } });
      toast.success(`House type ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to ${newStatus === 'Active' ? 'activate' : 'deactivate'} house type: ` + err.message);
    }
  };

  const handleSave = async (houseTypeData: Partial<HouseType>) => {
    try {
      if (editingHouseType) {
        await updateHouseType({ id: editingHouseType.id, updates: houseTypeData });
        toast.success('House type updated successfully');
      } else {
        await addHouseType({
          name: houseTypeData.name!,
          description: houseTypeData.description || null,
          status: houseTypeData.status || 'Active',
        });
        toast.success('House type added successfully');
      }
      setShowAddDialog(false);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to ${editingHouseType ? 'update' : 'add'} house type: ` + err.message);
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
            <DialogTitle>Manage House Types</DialogTitle>
            <DialogDescription>
              View and manage the master list of house types available across all locations.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Search house types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd}>
              <Plus className="size-4 me-2" />
              Add House Type
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
                {sortedAndFilteredHouseTypes.map((houseType) => (
                  <TableRow key={houseType.id}>
                    <TableCell className="font-medium">{houseType.name}</TableCell>
                    <TableCell>{houseType.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={houseType.status === 'Active' ? 'success' : 'secondary'}>
                        {houseType.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(houseType)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(houseType)}
                        >
                          {houseType.status === 'Active' ? 'Deactivate' : 'Activate'}
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

      <HouseTypeMasterQuickAdd
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSave}
        houseType={editingHouseType}
      />
    </>
  );
}
