import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useHouses } from '@/hooks/use-houses';
import { logActivity } from '@/lib/activity-logger';

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddParticipantDialog({ open, onOpenChange, onSuccess }: AddParticipantDialogProps) {
  const { houses } = useHouses();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    ndis_number: '',
    house_id: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .insert([
          {
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            date_of_birth: formData.date_of_birth || null,
            ndis_number: formData.ndis_number || null,
            house_id: formData.house_id || null,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log the activity
      await logActivity({
        activityType: 'create',
        entityType: 'participant',
        entityId: data.id,
        entityName: formData.name,
        userName: 'Current User', // TODO: Get from auth context
      });

      toast.success('Participant created successfully');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        ndis_number: '',
        house_id: '',
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating participant:', error);
      toast.error('Failed to create participant', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Participant</DialogTitle>
          <DialogDescription>
            Create a new participant profile. You can add more details later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="0412 345 678"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ndis_number">NDIS Number</Label>
              <Input
                id="ndis_number"
                value={formData.ndis_number}
                onChange={(e) => handleChange('ndis_number', e.target.value)}
                placeholder="Enter NDIS number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="house_id">House Assignment</Label>
              <Select value={formData.house_id} onValueChange={(value) => handleChange('house_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a house" />
                </SelectTrigger>
                <SelectContent>
                  {houses
                    .filter((h) => h.status === 'active')
                    .map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Participant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
