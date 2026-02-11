import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

export interface ShiftFormData {
  staff_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  house_id: string;
  shift_type: string;
  status: string;
  notes: string;
  participant_ids: string[];
}

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any | null;
  staffId?: string;
  staffList: Array<{ id: string; name: string }>;
  staffSelectionDisabled: boolean;
  houses: Array<{ id: string; name: string }>;
  participants: Array<{ id: string; name: string }>;
  onSave: (formData: ShiftFormData) => Promise<void>;
  onDelete?: (shiftId: string) => Promise<void>;
}

export function ShiftDialog({
  open,
  onOpenChange,
  shift,
  staffId,
  staffList,
  staffSelectionDisabled,
  houses,
  participants,
  onSave,
  onDelete,
}: ShiftDialogProps) {
  const [formData, setFormData] = useState<ShiftFormData>({
    staff_id: staffId || '',
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    house_id: '',
    shift_type: 'SIL',
    status: 'Scheduled',
    notes: '',
    participant_ids: [],
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (shift) {
      setFormData({
        staff_id: shift.staff_id || staffId || '',
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        house_id: shift.house_id || '',
        shift_type: shift.shift_type,
        status: shift.status,
        notes: shift.notes || '',
        participant_ids: shift.participants?.map((p: any) => p.id) || [],
      });
    } else {
      setFormData({
        staff_id: staffId || '',
        shift_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '17:00',
        house_id: '',
        shift_type: 'SIL',
        status: 'Scheduled',
        notes: '',
        participant_ids: [],
      });
    }
  }, [shift, staffId, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shift || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(shift.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  const toggleParticipant = (participantId: string) => {
    const currentIds = formData.participant_ids;
    if (currentIds.includes(participantId)) {
      setFormData({
        ...formData,
        participant_ids: currentIds.filter(id => id !== participantId),
      });
    } else {
      setFormData({
        ...formData,
        participant_ids: [...currentIds, participantId],
      });
    }
  };

  const isEdit = shift !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update shift details and assignments.' : 'Create a new shift and assign participants.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staff_id">Staff Member *</Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                disabled={staffSelectionDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || 'Unnamed Staff'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shift_date">Date *</Label>
              <Input
                id="shift_date"
                type="date"
                value={formData.shift_date}
                onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="house_id">House</Label>
              <Select 
                value={formData.house_id || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, house_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {houses.map(house => (
                    <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="No Show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="shift_type">Shift Type *</Label>
            <Select value={formData.shift_type} onValueChange={(value) => setFormData({ ...formData, shift_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIL">SIL</SelectItem>
                <SelectItem value="Community">Community</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="participant_ids">Linked Participants</Label>
            <Select
              value={formData.participant_ids[0] || ''}
              onValueChange={toggleParticipant}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select participants" />
              </SelectTrigger>
              <SelectContent>
                {participants.map(participant => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.participant_ids.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.participant_ids.map(id => {
                  const participant = participants.find(p => p.id === id);
                  return participant ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {participant.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleParticipant(id)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {isEdit && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || deleting}>
              {saving ? 'Saving...' : isEdit ? 'Update Shift' : 'Create Shift'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
