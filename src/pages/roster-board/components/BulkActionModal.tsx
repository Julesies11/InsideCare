import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (params: any, action: 'update' | 'delete', updates?: any) => Promise<void>;
  houses: any[];
  staff: any[];
  shiftTypes: any[];
  initialFilters?: {
    houseId: string;
    staffId: string;
    startDate: string;
    endDate: string;
  };
}

export function BulkActionModal({ 
  open, 
  onClose, 
  onConfirm, 
  houses, 
  staff: _staff, 
  shiftTypes,
  initialFilters 
}: BulkActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    houseId: initialFilters?.houseId || 'all',
    staffId: 'all',
    shiftTypeId: 'all',
    startDate: initialFilters?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialFilters?.endDate || new Date().toISOString().split('T')[0],
  });

  const selectedHouse = houses.find(h => h.id === filters.houseId);
  const houseName = selectedHouse ? selectedHouse.name : (filters.houseId === 'all' ? 'All Houses' : 'Selected House');

  const handleConfirm = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Please select a date range');
      return;
    }

    const confirmed = window.confirm(`ARE YOU ABSOLUTELY SURE? This will permanently delete all shifts matching your criteria for ${houseName}. This action cannot be undone.`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onConfirm(filters, 'delete');
      toast.success(`Deletion completed successfully`);
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
            <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Delete Shifts</DialogTitle>
              <DialogDescription className="text-sm font-bold text-orange-600 uppercase tracking-wider">
                House: {houseName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Filter by Template Type</Label>
            <Select value={filters.shiftTypeId} onValueChange={(val) => setFilters({ ...filters, shiftTypeId: val })}>
              <SelectTrigger className="h-10 text-sm bg-gray-50/50">
                <SelectValue placeholder="All Template Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {shiftTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Start Date</Label>
              <Input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="h-10 text-sm bg-gray-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">End Date</Label>
              <Input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} 
                className="h-10 text-sm bg-gray-50/50"
              />
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
