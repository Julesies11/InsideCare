import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useFundingTypesMaster } from '@/hooks/useFundingTypesMaster';
import { FundingTypeMaster } from '@/models/funding-type-master';
import { FundingTypeMasterQuickAdd } from './funding-type-master-quick-add';
import { toast } from 'sonner';

interface FundingTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'name' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function FundingTypeMasterDialog({
  open,
  onClose,
  onUpdate,
}: FundingTypeMasterDialogProps) {
  const { fundingTypes, loading, addFundingType, updateFundingType, refresh } = useFundingTypesMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFundingType, setEditingFundingType] = useState<FundingTypeMaster | null>(null);
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

  const sortedAndFilteredFundingTypes = useMemo(() => {
    let filtered = fundingTypes.filter((ft) =>
      ft.name.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [fundingTypes, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingFundingType(null);
    setShowAddDialog(true);
  };

  const handleEdit = (fundingType: FundingTypeMaster) => {
    setEditingFundingType(fundingType);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (fundingType: FundingTypeMaster) => {
    const newStatus = !fundingType.is_active;
    const { error } = await updateFundingType(fundingType.id, { is_active: newStatus });
    if (error) {
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} funding type: ` + error);
    } else {
      toast.success(`Funding type ${newStatus ? 'activated' : 'deactivated'} successfully`);
      await refresh();
      onUpdate();
    }
  };

  const handleSave = async (fundingTypeData: Partial<FundingTypeMaster>) => {
    if (editingFundingType) {
      const { error } = await updateFundingType(editingFundingType.id, fundingTypeData);
      if (error) {
        toast.error('Failed to update funding type: ' + error);
      } else {
        toast.success('Funding type updated successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    } else {
      const { error } = await addFundingType({
        name: fundingTypeData.name!,
        is_active: fundingTypeData.is_active ?? true,
        created_by: null,
        updated_by: null,
      });
      if (error) {
        toast.error('Failed to add funding type: ' + error);
      } else {
        toast.success('Funding type added successfully');
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
            <DialogTitle>Manage Funding Types</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search funding types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
              <Plus className="size-4 me-1.5" />
              Add Funding Type
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading funding types...</div>
            ) : sortedAndFilteredFundingTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No funding types found matching your search' : 'No funding types available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Funding Type Name
                      <SortIcon field="name" />
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
                  {sortedAndFilteredFundingTypes.map((fundingType) => (
                    <TableRow key={fundingType.id}>
                      <TableCell className="font-medium">{fundingType.name}</TableCell>
                      <TableCell>
                        <Badge variant={fundingType.is_active ? 'success' : 'secondary'}>
                          {fundingType.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(fundingType)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(fundingType)}
                            title={fundingType.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {fundingType.is_active ? 'Deactivate' : 'Activate'}
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

      <FundingTypeMasterQuickAdd
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingFundingType(null);
        }}
        onSave={handleSave}
        editingFundingType={editingFundingType}
      />
    </>
  );
}
