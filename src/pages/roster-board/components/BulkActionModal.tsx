import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Trash2, Loader2 } from 'lucide-react';
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
  staff, 
  shiftTypes,
  initialFilters 
}: BulkActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    houseId: initialFilters?.houseId || 'all',
    staffId: initialFilters?.staffId || 'all',
    shiftTypeId: 'all',
    startDate: initialFilters?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialFilters?.endDate || new Date().toISOString().split('T')[0],
  });

  const handleConfirm = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Please select a date range');
      return;
    }

    const confirmed = window.confirm('ARE YOU ABSOLUTELY SURE? This will permanently delete all shifts matching your criteria. This action cannot be undone.');
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-orange-600" />
            Delete Shifts
          </DialogTitle>
          <DialogDescription>
            Delete multiple shifts at once based on your targeting filters.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} 
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Targeting Filters</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase">House</Label>
                <Select value={filters.houseId} onValueChange={(val) => setFilters({ ...filters, houseId: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Houses</SelectItem>
                    {houses.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase">Staff</Label>
                <Select value={filters.staffId} onValueChange={(val) => setFilters({ ...filters, staffId: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase">Shift Type</Label>
                <Select value={filters.shiftTypeId} onValueChange={(val) => setFilters({ ...filters, shiftTypeId: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {shiftTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-destructive">Destructive Action</p>
              <p className="text-[10px] text-destructive/80 leading-tight">
                This will permanently delete all shifts matching the filters above. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Shifts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
