import { useEffect, useState } from 'react';
import { Role } from '@/hooks/use-roles';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

interface RoleMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Role>) => void;
  role?: Role | null;
}

export function RoleMasterQuickAdd({
  open,
  onClose,
  onSave,
  role,
}: RoleMasterQuickAddProps) {
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (role) {
      setFormData({
        role_name: role.role_name,
        description: role.description || '',
        is_active: role.is_active,
      });
    } else {
      setFormData({
        role_name: '',
        description: '',
        is_active: true,
      });
    }
  }, [role, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role_name.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Add Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.role_name}
                onChange={(e) =>
                  setFormData({ ...formData, role_name: e.target.value })
                }
                placeholder="Role name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Role description"
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
              <Label htmlFor="is_active">Role is Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{role ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
