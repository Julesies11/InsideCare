import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HouseCalendarEventType } from '@/hooks/useHouseCalendarEvents';

interface HouseCalendarEventTypeMasterQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<HouseCalendarEventType>) => void;
  eventType?: HouseCalendarEventType | null;
}

export function HouseCalendarEventTypeMasterQuickAdd({
  open,
  onClose,
  onSave,
  eventType,
}: HouseCalendarEventTypeMasterQuickAddProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    color: 'blue',
  });

  useEffect(() => {
    if (eventType) {
      setFormData({
        name: eventType.name,
        description: eventType.description || '',
        status: eventType.status,
        color: eventType.color || 'blue',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'Active',
        color: 'blue',
      });
    }
  }, [eventType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{eventType ? 'Edit Event Type' : 'Add Event Type'}</DialogTitle>
          <DialogDescription>
            {eventType ? 'Update the details for this calendar event type.' : 'Create a new calendar event type for the master list.'}
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
                placeholder="Event type name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event type description"
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

            <div className="space-y-2">
              <Label htmlFor="color">Calendar Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger id="color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-blue-500" />Blue</div></SelectItem>
                  <SelectItem value="green"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-green-500" />Green</div></SelectItem>
                  <SelectItem value="purple"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-purple-500" />Purple</div></SelectItem>
                  <SelectItem value="orange"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-orange-500" />Orange</div></SelectItem>
                  <SelectItem value="red"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-red-500" />Red</div></SelectItem>
                  <SelectItem value="pink"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-pink-500" />Pink</div></SelectItem>
                  <SelectItem value="indigo"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-indigo-500" />Indigo</div></SelectItem>
                  <SelectItem value="cyan"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-cyan-500" />Cyan</div></SelectItem>
                  <SelectItem value="gray"><div className="flex items-center gap-2"><div className="size-3 rounded-full bg-gray-500" />Gray</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {eventType ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
