import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useFundingSourcesMaster } from '@/hooks/useFundingSourcesMaster';
import { FundingSourceMaster } from '@/models/funding-source-master';
import { FundingSourceMasterQuickAdd } from './funding-source-master-quick-add';
import { toast } from 'sonner';

interface FundingSourceMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'name' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function FundingSourceMasterDialog({
  open,
  onClose,
  onUpdate,
}: FundingSourceMasterDialogProps) {
  const { fundingSources, loading, addFundingSource, updateFundingSource, refresh } = useFundingSourcesMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFundingSource, setEditingFundingSource] = useState<FundingSourceMaster | null>(null);
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

  const sortedAndFilteredFundingSources = useMemo(() => {
    let filtered = fundingSources.filter((fs) =>
      fs.name.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [fundingSources, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingFundingSource(null);
    setShowAddDialog(true);
  };

  const handleEdit = (fundingSource: FundingSourceMaster) => {
    setEditingFundingSource(fundingSource);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (fundingSource: FundingSourceMaster) => {
    const newStatus = !fundingSource.is_active;
    const { error } = await updateFundingSource(fundingSource.id, { is_active: newStatus });
    if (error) {
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} funding source: ` + error);
    } else {
      toast.success(`Funding source ${newStatus ? 'activated' : 'deactivated'} successfully`);
      await refresh();
      onUpdate();
    }
  };

  const handleSave = async (fundingSourceData: Partial<FundingSourceMaster>) => {
    if (editingFundingSource) {
      const { error } = await updateFundingSource(editingFundingSource.id, fundingSourceData);
      if (error) {
        toast.error('Failed to update funding source: ' + error);
      } else {
        toast.success('Funding source updated successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    } else {
      const { error } = await addFundingSource({
        name: fundingSourceData.name!,
        is_active: fundingSourceData.is_active ?? true,
        created_by: null,
        updated_by: null,
      });
      if (error) {
        toast.error('Failed to add funding source: ' + error);
      } else {
        toast.success('Funding source added successfully');
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
            <DialogTitle>Manage Funding Sources</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search funding sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
              <Plus className="size-4 me-1.5" />
              Add Funding Source
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading funding sources...</div>
            ) : sortedAndFilteredFundingSources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No funding sources found matching your search' : 'No funding sources available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Funding Source Name
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
                  {sortedAndFilteredFundingSources.map((fundingSource) => (
                    <TableRow key={fundingSource.id}>
                      <TableCell className="font-medium">{fundingSource.name}</TableCell>
                      <TableCell>
                        <Badge variant={fundingSource.is_active ? 'success' : 'secondary'}>
                          {fundingSource.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(fundingSource)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(fundingSource)}
                            title={fundingSource.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {fundingSource.is_active ? 'Deactivate' : 'Activate'}
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

      <FundingSourceMasterQuickAdd
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingFundingSource(null);
        }}
        onSave={handleSave}
        editingFundingSource={editingFundingSource}
      />
    </>
  );
}
