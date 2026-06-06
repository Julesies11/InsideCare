import { useState, useMemo } from 'react';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, ShieldCheck, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useComplianceTypes, useAddComplianceType, useUpdateComplianceType } from '@/hooks/use-staff';
import { toast } from 'sonner';

type SortField = 'compliance_name' | 'is_active' | 'is_default_global';
type SortDirection = 'asc' | 'desc';

export function ComplianceSettingsPage() {
  // States
  const { types = [], isLoading: loading, refetch } = useComplianceTypes(true); // include inactive
  const { mutateAsync: addType } = useAddComplianceType();
  const { mutateAsync: updateType } = useUpdateComplianceType();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('compliance_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState({
    compliance_name: '',
    description: '',
    is_active: true,
    is_default_global: false,
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

  const sortedAndFilteredTypes = useMemo(() => {
    const filtered = types.filter((t) =>
      t.compliance_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'is_active' || sortField === 'is_default_global') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [types, searchQuery, sortField, sortDirection]);

  // Actions
  const handleAddClick = () => {
    setEditingType(null);
    setFormData({
      compliance_name: '',
      description: '',
      is_active: true,
      is_default_global: false,
    });
    setShowDialog(true);
  };

  const handleEditClick = (type: any) => {
    setEditingType(type);
    setFormData({
      compliance_name: type.compliance_name,
      description: type.description || '',
      is_active: type.is_active ?? true,
      is_default_global: type.is_default_global ?? false,
    });
    setShowDialog(true);
  };

  const handleToggleActive = async (type: any) => {
    const newActive = !type.is_active;
    try {
      await updateType({ id: type.id, updates: { is_active: newActive } });
      toast.success(`Compliance check ${newActive ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (err: any) {
      toast.error('Failed to toggle active status: ' + err.message);
    }
  };

  const handleToggleGlobal = async (type: any) => {
    const newGlobal = !type.is_default_global;
    try {
      await updateType({ id: type.id, updates: { is_default_global: newGlobal } });
      toast.success(`Compliance check global default status updated successfully`);
      refetch();
    } catch (err: any) {
      toast.error('Failed to toggle global default status: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!formData.compliance_name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingType) {
        await updateType({
          id: editingType.id,
          updates: {
            compliance_name: formData.compliance_name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
            is_default_global: formData.is_default_global,
          },
        });
        toast.success('Compliance requirement updated successfully');
      } else {
        // Check for duplicates locally first
        const isDuplicate = types.some(
          (t) => t.compliance_name.toLowerCase() === formData.compliance_name.trim().toLowerCase()
        );
        if (isDuplicate) {
          toast.error('A compliance requirement with this name already exists');
          return;
        }

        await addType({
          compliance_name: formData.compliance_name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
          is_default_global: formData.is_default_global,
        });
        toast.success('Compliance requirement created successfully');
      }
      setShowDialog(false);
      refetch();
    } catch (err: any) {
      toast.error('Failed to save compliance requirement: ' + err.message);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-4 ms-1 inline opacity-30" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-4 ms-1 inline" />
    ) : (
      <ArrowDown className="size-4 ms-1 inline" />
    );
  };

  return (
    <Container>
      <div className="flex flex-col gap-5 lg:gap-7.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck className="size-6 text-gray-600 dark:text-gray-400" />
              Compliance Configuration
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the master list of staff compliance checks and set global defaults.
            </p>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="size-4 me-1.5" />
            Add Compliance Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Compliance Checklist Master List</CardTitle>
                <CardDescription>
                  Configure active checks and toggle global requirements across all facilities.
                </CardDescription>
              </div>
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs h-9 bg-white"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground animate-pulse">
                Loading compliance configurations...
              </div>
            ) : sortedAndFilteredTypes.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {searchQuery ? 'No compliance checks match your query.' : 'No compliance checks configured. Click "Add Compliance Type" to create one.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="w-[40%] cursor-pointer select-none"
                        onClick={() => handleSort('compliance_name')}
                      >
                        Requirement Name
                        <SortIcon field="compliance_name" />
                      </TableHead>
                      <TableHead
                        className="w-[20%] cursor-pointer select-none"
                        onClick={() => handleSort('is_default_global')}
                      >
                        Global Default
                        <SortIcon field="is_default_global" />
                      </TableHead>
                      <TableHead
                        className="w-[20%] cursor-pointer select-none"
                        onClick={() => handleSort('is_active')}
                      >
                        Status
                        <SortIcon field="is_active" />
                      </TableHead>
                      <TableHead className="w-[20%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {type.compliance_name}
                            </span>
                            {type.description && (
                              <span className="text-xs text-muted-foreground mt-0.5 max-w-md line-clamp-2">
                                {type.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={type.is_default_global ?? false}
                              onCheckedChange={() => handleToggleGlobal(type)}
                            />
                            {type.is_default_global && (
                              <Badge variant="primary" className="text-[8px] tracking-widest font-black uppercase">
                                Global
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={type.is_active ? 'success' : 'secondary'}>
                            {type.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(type)}>
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={type.is_active ? 'text-destructive' : 'text-success'}
                              onClick={() => handleToggleActive(type)}
                            >
                              {type.is_active ? 'Deactivate' : 'Activate'}
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
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Compliance Type' : 'Add Compliance Type'}
            </DialogTitle>
            <DialogDescription>
              {editingType ? 'Update the details for this compliance check.' : 'Create a new compliance requirement for staff records.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="type-name">Requirement Name</Label>
              <Input
                id="type-name"
                value={formData.compliance_name}
                onChange={(e) => setFormData({ ...formData, compliance_name: e.target.value })}
                placeholder="e.g. Drivers License"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type-desc">Description</Label>
              <Textarea
                id="type-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this compliance check validates..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
              <div className="space-y-0.5">
                <Label htmlFor="type-active" className="cursor-pointer font-semibold">Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable this check for selection</p>
              </div>
              <Switch
                id="type-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
              <div className="space-y-0.5">
                <Label htmlFor="type-global" className="cursor-pointer font-semibold">Global Default</Label>
                <p className="text-xs text-muted-foreground">Auto-require for all house assignments</p>
              </div>
              <Switch
                id="type-global"
                checked={formData.is_default_global}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default_global: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Compliance Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
