import { useState } from 'react';
import { Check, Edit2, Plus, Search, X } from 'lucide-react';
import {
  BehaviourTypeMaster,
  useAddBehaviourTypeMaster,
  useBehaviourTypesMaster,
  useUpdateBehaviourTypeMaster,
} from '@/hooks/use-behaviour-types-master';
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
import { Textarea } from '@/components/ui/textarea';

interface BehaviourTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  canEdit?: boolean;
}

export function BehaviourTypeMasterDialog({
  open,
  onClose,
  canEdit = true,
}: BehaviourTypeMasterDialogProps) {
  const { data: items = [], isLoading } = useBehaviourTypesMaster();
  const { mutateAsync: addType } = useAddBehaviourTypeMaster();
  const { mutateAsync: updateType } = useUpdateBehaviourTypeMaster();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleEdit = (item: BehaviourTypeMaster) => {
    setEditingId(item.id);
    setFormData({ name: item.name, description: item.description || '' });
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingId) {
        await updateType({ id: editingId, ...formData });
      } else {
        await addType(formData);
      }
      resetForm();
    } catch {
      // Error handled in hook
    }
  };

  const handleToggleStatus = async (item: BehaviourTypeMaster) => {
    try {
      await updateType({ id: item.id, is_active: !item.is_active });
    } catch {
      // Error handled in hook
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setIsAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl flex items-center justify-between">
            Manage Behaviour Types
            {canEdit && !isAdding && !editingId && (
              <Button size="sm" onClick={() => setIsAdding(true)}>
                <Plus className="size-4 me-2" />
                Add Type
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {isAdding || editingId ? (
            <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  {editingId ? 'Edit Behaviour Type' : 'Add New Behaviour Type'}
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
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Verbal Aggression, Social Withdrawal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type-desc">Description</Label>
                  <Textarea
                    id="type-desc"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description of the behaviour type..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!formData.name.trim()}
                  >
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          <ScrollArea className="flex-1 border rounded-lg">
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Loading types...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {searchQuery
                    ? 'No matching types found.'
                    : 'No behaviour types added yet.'}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.name}</span>
                        {!item.is_active && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleToggleStatus(item)}
                          title={item.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {item.is_active ? (
                            <X className="size-4 text-destructive" />
                          ) : (
                            <Check className="size-4 text-primary" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
