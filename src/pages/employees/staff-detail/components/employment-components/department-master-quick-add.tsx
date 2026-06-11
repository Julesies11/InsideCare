import { useEffect, useState } from 'react';
import { Department } from '@/hooks/use-departments-master';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface DepartmentMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Department>) => void;
  department?: Department | null;
}

export function DepartmentMasterQuickAdd({
  open,
  onClose,
  onSave,
  department,
}: DepartmentMasterQuickAddProps) {
  const [formData, setFormData] = useState({
    department_name: '',
    description: '',
    access_level: 'Limited',
    status: 'Active',
  });

  useEffect(() => {
    if (department) {
      setFormData({
        department_name: department.department_name,
        description: department.description || '',
        access_level: department.access_level || 'Limited',
        status: department.status,
      });
    } else {
      setFormData({
        department_name: '',
        description: '',
        access_level: 'Limited',
        status: 'Active',
      });
    }
  }, [department, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_name.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Add Department'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.department_name}
                onChange={(e) =>
                  setFormData({ ...formData, department_name: e.target.value })
                }
                placeholder="Department name"
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
                placeholder="Department description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_level">Access Level</Label>
              <Select
                value={formData.access_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, access_level: value })
                }
              >
                <SelectTrigger id="access_level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Limited">Limited</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{department ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
