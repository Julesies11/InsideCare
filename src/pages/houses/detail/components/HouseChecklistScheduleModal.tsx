import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RRuleGenerator } from './RRuleGenerator';
import { useChecklistSchedules } from '@/hooks/useChecklistSchedules';
import { format, addMonths } from 'date-fns';
import { CalendarDays, Loader2 } from 'lucide-react';

interface HouseChecklistScheduleModalProps {
  open: boolean;
  onClose: () => void;
  houseId: string;
  checklist: {
    id: string;
    name: string;
  } | null;
}

export function HouseChecklistScheduleModal({ 
  open, 
  onClose, 
  houseId, 
  checklist 
}: HouseChecklistScheduleModalProps) {
  const [rrule, setRrule] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  const { createSchedule, loading } = useChecklistSchedules(houseId);

  const handleSave = async () => {
    if (!checklist || !rrule) return;
    if (!endDate) {
      toast.error('Please select an end date.');
      return;
    }

    await createSchedule({
      house_id: houseId,
      house_checklist_id: checklist.id,
      rrule,
      start_date: startDate,
      end_date: endDate,
      is_active: true
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            Schedule Checklist
          </DialogTitle>
          <DialogDescription>
            Set up a recurring schedule for "{checklist?.name}" on the house calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RRuleGenerator onChange={setRrule} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <strong>Note:</strong> Saving this schedule will automatically generate calendar events for the specified date range.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !rrule}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
