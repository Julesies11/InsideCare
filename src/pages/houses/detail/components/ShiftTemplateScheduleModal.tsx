import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RRuleGenerator } from './RRuleGenerator';
import { useShiftTemplates } from '@/hooks/use-shift-templates';
import { format, addMonths } from 'date-fns';
import { CalendarDays, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ShiftTemplateScheduleModalProps {
  open: boolean;
  onClose: () => void;
  houseId: string;
  template: {
    id: string;
    name: string;
  } | null;
}

export function ShiftTemplateScheduleModal({ 
  open, 
  onClose, 
  houseId, 
  template 
}: ShiftTemplateScheduleModalProps) {
  const [rrule, setRrule] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 12), 'yyyy-MM-dd'));
  
  const { createSchedule, isLoading } = useShiftTemplates(houseId);

  const handleSave = async () => {
    if (!template) return;
    if (!rrule) {
      toast.error('Please define a frequency for this shift template.');
      return;
    }

    try {
      await createSchedule.mutateAsync({
        house_id: houseId,
        template_group_id: template.id,
        rrule,
        start_date: startDate,
        end_date: endDate,
        is_active: true
      });
      toast.success(`Schedule created for "${template.name}". These shifts will now auto-populate the roster.`);
      onClose();
    } catch (err: any) {
      toast.error(`Failed to schedule: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="size-6 text-primary" />
            Schedule "{template?.name}"
          </DialogTitle>
          <DialogDescription>
            Define a recurring pattern for this shift template. 
            Shifts within this template will be automatically generated on the Roster Board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Info className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Recurrence Pattern</span>
            </div>
            
            <RRuleGenerator onChange={setRrule} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-[10px] font-bold uppercase text-muted-foreground">Effective From</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-[10px] font-bold uppercase text-muted-foreground">Until (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
            <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong>Important:</strong> Applying a schedule will materialize "Open Shifts" for the selected dates. 
              These shifts will inherit the default checklists defined in your Shift Model, unless overridden within the template itself.
            </div>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 p-6 -m-6 mt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={createSchedule.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={createSchedule.isPending || !rrule}
            className="px-8 font-bold"
          >
            {createSchedule.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Activate Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
