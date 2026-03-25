import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShiftTemplates } from '@/hooks/use-shift-templates';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { CalendarDays, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApplyShiftTemplateModalProps {
  open: boolean;
  onClose: () => void;
  houseId: string;
  onApply: (templateId: string, startDate: string, endDate: string) => Promise<void>;
  initialDate?: Date;
}

export function ApplyShiftTemplateModal({ 
  open, 
  onClose, 
  houseId, 
  onApply,
  initialDate = new Date()
}: ApplyShiftTemplateModalProps) {
  const { groups, isLoading } = useShiftTemplates(houseId);
  const [templateId, setTemplateId] = useState<string>('');
  const [startDate, setStartDate] = useState(format(startOfWeek(initialDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(initialDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!templateId) {
      toast.error('Please select a template to apply.');
      return;
    }

    try {
      setIsApplying(true);
      await onApply(templateId, startDate, endDate);
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="size-5 text-primary" />
            Apply Shift Template
          </DialogTitle>
          <DialogDescription>
            Select a template to materialize "Open Shifts" on the roster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Select Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Loading templates...' : 'Choose a template'} />
              </SelectTrigger>
              <SelectContent>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 p-6 -m-6 mt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isApplying || !templateId} className="px-8 font-bold">
            {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Apply to Roster'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
