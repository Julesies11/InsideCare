import { useMemo, useState } from 'react';
import { MedicationType } from '@/api/master-lists.api';
import { Edit2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddMedicationType,
  useMedicationTypes,
  useUpdateMedicationType,
} from '@/hooks/use-medications-master';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

interface MedicationTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  canEdit?: boolean;
}

export function MedicationTypeMasterDialog({
  open,
  onClose,
  canEdit = true,
}: MedicationTypeMasterDialogProps) {
  const { data: items = [], isLoading } = useMedicationTypes(true); // Always include inactive in management
  const { mutateAsync: addType } = useAddMedicationType();
  const { mutateAsync: updateType } = useUpdateMedicationType();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ medication_type_name: '' });
  const [isAdding, setIsAdding] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.medication_type_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [items, searchQuery]);

  const handleEdit = (item: MedicationType) => {
    setEditingId(item.id);
    setFormData({ medication_type_name: item.medication_type_name });
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.medication_type_name.trim()) return;

    try {
      if (editingId) {
        const oldItem = items.find((i) => i.id === editingId);
        await updateType({
          id: editingId,
          name: formData.medication_type_name,
          oldName: oldItem?.medication_type_name,
        });
        toast.success('Medication type updated');
      } else {
        await addType(formData.medication_type_name);
        toast.success('Medication type added');
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save medication type');
    }
  };

  const handleToggleStatus = async (item: MedicationType) => {
    try {
      await updateType({
        id: item.id,
        is_active: !item.is_active,
        oldActive: item.is_active,
      });
      toast.success(
        `Medication type ${!item.is_active ? 'activated' : 'deactivated'}`,
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ medication_type_name: '' });
    setIsAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 pe-16 border-b shrink-0">
          <DialogTitle className="text-xl flex items-center justify-between gap-4">
            <span className="truncate">Manage Medication Types</span>
            {canEdit && !isAdding && !editingId && (
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                className="shrink-0"
              >
                <Plus className="size-4 me-2" />
                Add Type
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
          {isAdding || editingId ? (
            <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4 animate-in fade-in slide-in-from-top-2 shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  {editingId
                    ? 'Edit Medication Type'
                    : 'Add New Medication Type'}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="type-name">Type Name *</Label>
                  <Input
                    id="type-name"
                    value={formData.medication_type_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medication_type_name: e.target.value,
                      })
                    }
                    placeholder="e.g. Antipsychotic, Supplement"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!formData.medication_type_name.trim()}
                  >
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Loading types...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {searchQuery
                      ? 'No matching types found.'
                      : 'No medication types added yet.'}
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 pe-4 min-w-0">
                        <span
                          className={`font-medium text-sm truncate ${!item.is_active ? 'text-muted-foreground' : ''}`}
                        >
                          {item.medication_type_name}
                        </span>
                        {!item.is_active && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 h-4 uppercase font-bold tracking-wider shrink-0"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-3 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <div className="flex items-center gap-2 ps-2 border-s">
                            <Switch
                              checked={item.is_active}
                              onCheckedChange={() => handleToggleStatus(item)}
                              className="scale-75"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
