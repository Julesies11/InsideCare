import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkDeleteCalendarModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (params: { startDate: string; endDate: string; deleteShifts: boolean; deleteEvents: boolean; deleteChecklists: boolean }) => Promise<void>;
  houseName: string;
}

export function BulkDeleteCalendarModal({ 
  open, 
  onClose, 
  onConfirm, 
  houseName,
}: BulkDeleteCalendarModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteShifts, setDeleteShifts] = useState(true);
  const [deleteEvents, setDeleteEvents] = useState(true);
  const [deleteChecklists, setDeleteChecklists] = useState(true);

  const handleConfirm = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select a date range');
      return;
    }

    if (!deleteShifts && !deleteEvents && !deleteChecklists) {
      toast.error('Please select at least one entity type to delete');
      return;
    }

    const confirmed = window.confirm(`ARE YOU ABSOLUTELY SURE? This will permanently delete selected data matching your criteria for ${houseName}. This action cannot be undone.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onConfirm({ startDate, endDate, deleteShifts, deleteEvents, deleteChecklists });
      onClose();
    } catch (error: any) {
      console.error('Deletion failed:', error);
      toast.error(`Failed to perform deletion: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-red-600">Bulk Delete Data</DialogTitle>
              <DialogDescription className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                House: {houseName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Start Date</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-sm bg-gray-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">End Date</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="h-10 text-sm bg-gray-50/50"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">Data to Delete</Label>
            
            <div className="flex items-center space-x-3">
              <Checkbox id="delete-shifts" checked={deleteShifts} onCheckedChange={(c) => setDeleteShifts(!!c)} />
              <div className="space-y-1 leading-none">
                <Label htmlFor="delete-shifts" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Staff Shifts
                </Label>
                <p className="text-[10px] text-muted-foreground">Deletes scheduled shifts in this range</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox id="delete-events" checked={deleteEvents} onCheckedChange={(c) => setDeleteEvents(!!c)} />
              <div className="space-y-1 leading-none">
                <Label htmlFor="delete-events" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Calendar Events
                </Label>
                <p className="text-[10px] text-muted-foreground">Deletes meetings, appointments, and scheduled checklist events</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox id="delete-checklists" checked={deleteChecklists} onCheckedChange={(c) => setDeleteChecklists(!!c)} />
              <div className="space-y-1 leading-none">
                <Label htmlFor="delete-checklists" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Checklist Submissions
                </Label>
                <p className="text-[10px] text-muted-foreground">Deletes executed/submitted checklists created in this range</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="font-bold text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="min-w-[140px] font-black uppercase tracking-tight shadow-lg shadow-destructive/20"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
