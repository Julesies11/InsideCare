import { useMemo, useState } from 'react';
import { Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { masterListsApi } from '@/api/master-lists.api';
import { TABLES } from '@/config/db-tables';
import { handleError } from '@/errors/error-handler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { ClinicalTrackerMasterQuickAdd } from './clinical-tracker-master-quick-add';

interface ClinicalTrackerMasterDialogProps {
  open: boolean;
  onClose: () => void;
  taxonomy: { id: string; label: string; table: keyof typeof TABLES };
}

type SortField = 'name' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function ClinicalTrackerMasterDialog({
  open,
  onClose,
  taxonomy,
}: ClinicalTrackerMasterDialogProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch Data
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['admin-trackers', taxonomy.id],
    queryFn: () => masterListsApi.clinicalTrackers.list(TABLES[taxonomy.table] as any),
    enabled: open,
  });

  // Mutations
  const { mutateAsync: upsertItem } = useMutation({
    mutationFn: (record: any) => masterListsApi.clinicalTrackers.upsert(TABLES[taxonomy.table] as any, record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trackers', taxonomy.id] });
      queryClient.invalidateQueries({ queryKey: ['clinical-trackers-master'] });
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredItems = useMemo(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
  }, [items, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingItem(null);
    setShowAddDialog(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (item: any) => {
    const newStatus = !item.is_active;
    try {
      await upsertItem({
        ...item,
        is_active: newStatus,
      });
      toast.success(
        `${taxonomy.label} option ${newStatus ? 'activated' : 'deactivated'} successfully`,
      );
    } catch (error) {
      handleError(error, { title: `Failed to toggle ${taxonomy.label} status` });
    }
  };

  const handleSave = async (itemData: any) => {
    try {
      await upsertItem(editingItem ? { ...editingItem, ...itemData } : itemData);
      toast.success(`${taxonomy.label} option saved successfully`);
      setShowAddDialog(false);
    } catch (error) {
      handleError(error, { title: `Failed to save ${taxonomy.label} option` });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-2xl h-[80vh] flex flex-col"
          style={{ zIndex: 60 }}
        >
          <DialogHeader>
            <DialogTitle>Manage {taxonomy.label} List</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder={`Search ${taxonomy.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="secondary"
              size="sm"
              className="border border-gray-300"
              onClick={handleAdd}
            >
              <Plus className="size-4 me-1.5" />
              Add {taxonomy.label}
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : sortedAndFilteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? 'No options found matching your search'
                  : 'No options available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Option Name
                      <SortIcon
                        field="name"
                        currentField={sortField}
                        direction={sortDirection}
                      />
                    </TableHead>
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
                  {sortedAndFilteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? 'success' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(item)}
                            title={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {item.is_active ? 'Deactivate' : 'Activate'}
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

      <ClinicalTrackerMasterQuickAdd
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingItem={editingItem}
        taxonomyLabel={taxonomy.label}
      />
    </>
  );
}
