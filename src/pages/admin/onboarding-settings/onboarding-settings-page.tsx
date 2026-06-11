import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ClipboardCheck,
  Edit,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleError } from '@/errors/error-handler';
import {
  useAddOnboardingItemMaster,
  useOnboardingItemsMaster,
  useUpdateOnboardingItemMaster,
} from '@/hooks/use-staff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';

type SortField = 'item_name' | 'sort_order' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function OnboardingSettingsPage() {
  // Master List Hooks
  const {
    items = [],
    isLoading,
    refetch,
    error,
  } = useOnboardingItemsMaster(true);
  const { mutateAsync: addItem } = useAddOnboardingItemMaster();
  const { mutateAsync: updateItem } = useUpdateOnboardingItemMaster();

  // Master List State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('sort_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });

  // Sorting and Filtering
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredItems = useMemo(() => {
    const filtered = items.filter(
      (t) =>
        t.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description &&
          t.description.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'is_active') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;

      if (sortField !== 'item_name') {
        return a.item_name.localeCompare(b.item_name);
      }

      return 0;
    });

    return filtered;
  }, [items, searchQuery, sortField, sortDirection]);

  // Actions
  const handleAddItemClick = () => {
    setEditingItem(null);
    setFormData({
      item_name: '',
      description: '',
      is_active: true,
      sort_order: (items.length + 1) * 10,
    });
    setShowDialog(true);
  };

  const handleEditItemClick = (item: any) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      description: item.description || '',
      is_active: item.is_active ?? true,
      sort_order: item.sort_order ?? 0,
    });
    setShowDialog(true);
  };

  const handleToggleActive = async (item: any) => {
    const newActive = !item.is_active;
    try {
      await updateItem({ id: item.id, updates: { is_active: newActive } });
      toast.success(
        `Onboarding item ${newActive ? 'activated' : 'deactivated'} successfully`,
      );
      refetch();
    } catch (err: any) {
      handleError(err, { title: 'Failed to toggle active status' });
    }
  };

  const handleSave = async () => {
    if (!formData.item_name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id, updates: formData });
        toast.success('Onboarding item updated successfully');
      } else {
        await addItem(formData);
        toast.success('Onboarding item added successfully');
      }
      setShowDialog(false);
      refetch();
    } catch (err: any) {
      handleError(err, { title: 'Failed to save onboarding item' });
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="size-3.5 ms-2 text-muted-foreground/50" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-3.5 ms-2 text-primary" />
    ) : (
      <ArrowDown className="size-3.5 ms-2 text-primary" />
    );
  };

  return (
    <Container>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ClipboardCheck className="size-6 text-gray-600 dark:text-gray-400" />
              Onboarding Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the master list of tasks for staff onboarding.
            </p>
          </div>
          <Button onClick={handleAddItemClick}>
            <Plus className="size-4 me-1.5" />
            Add Onboarding Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle>Onboarding Master List</CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-500 font-bold text-[10px]"
                >
                  {sortedAndFilteredItems.length}
                </Badge>
              </div>
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs h-9 bg-white"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground animate-pulse">
                Loading onboarding items...
              </div>
            ) : error ? (
              <div className="py-10 text-center bg-red-50 rounded-lg border border-red-100 m-2">
                <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-700 font-medium">
                  Failed to load items
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {(error as any).message}
                </p>
              </div>
            ) : sortedAndFilteredItems.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {searchQuery
                  ? 'No onboarding items match your query.'
                  : 'No onboarding items configured. Click "Add Onboarding Item" to create one.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="w-[10%] cursor-pointer select-none text-center"
                        onClick={() => handleSort('sort_order')}
                      >
                        Order
                        <SortIcon field="sort_order" />
                      </TableHead>
                      <TableHead
                        className="w-[50%] cursor-pointer select-none"
                        onClick={() => handleSort('item_name')}
                      >
                        Task Name
                        <SortIcon field="item_name" />
                      </TableHead>
                      <TableHead
                        className="w-[20%] cursor-pointer select-none text-center"
                        onClick={() => handleSort('is_active')}
                      >
                        Status
                        <SortIcon field="is_active" />
                      </TableHead>
                      <TableHead className="w-[20%] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="text-center font-medium">
                          {item.sort_order}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {item.item_name}
                            </span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground mt-0.5 max-w-md line-clamp-2">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              item.is_active ? 'success' : 'secondary'
                            }
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItemClick(item)}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={
                                item.is_active
                                  ? 'text-destructive'
                                  : 'text-success'
                              }
                              onClick={() => handleToggleActive(item)}
                            >
                              {item.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Onboarding Item' : 'Add Onboarding Item'}
              </DialogTitle>
              <DialogDescription>
                Define a task for the staff onboarding checklist.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-name">Task Name</Label>
                <Input
                  id="item-name"
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      item_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Employee Induction"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-desc">Description (Optional)</Label>
                <Textarea
                  id="item-desc"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Details about this task..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="sort-order">Sort Order</Label>
                  <Input
                    id="sort-order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 pt-8">
                  <Label
                    htmlFor="is-active"
                    className="text-xs cursor-pointer"
                  >
                    Active
                  </Label>
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}
