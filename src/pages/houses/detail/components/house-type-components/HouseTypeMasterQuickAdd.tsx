import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HouseType } from '@/models/house';

interface HouseTypeMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<HouseType>) => void;
  houseType?: HouseType | null;
}

export function HouseTypeMasterQuickAdd({
  open,
  onClose,
  onSave,
  houseType,
}: HouseTypeMasterQuickAddProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  useEffect(() => {
    if (houseType) {
      setFormData({
        name: houseType.name,
        description: houseType.description || '',
        status: houseType.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'Active',
      });
    }
  }, [houseType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{houseType ? 'Edit House Type' : 'Add House Type'}</DialogTitle>
          <DialogDescription>
            {houseType ? 'Update the details for this house type.' : 'Create a new house type for the master list.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="House type name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="House type description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'Active' | 'Inactive' })}
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
            <Button type="submit">
              {houseType ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
