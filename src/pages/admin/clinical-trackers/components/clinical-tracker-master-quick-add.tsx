import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ClinicalTrackerMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editingItem: any | null;
  taxonomyLabel: string;
}

export function ClinicalTrackerMasterQuickAdd({
  open,
  onClose,
  onSave,
  editingItem,
  taxonomyLabel,
}: ClinicalTrackerMasterQuickAddProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        description: editingItem.description || '',
        is_active: editingItem.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
      });
    }
  }, [editingItem, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" style={{ zIndex: 70 }}>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? `Edit ${taxonomyLabel}` : `Add New ${taxonomyLabel}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description..."
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
