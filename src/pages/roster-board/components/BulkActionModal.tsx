import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Trash2, Edit, Loader2, Zap } from 'lucide-react';
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
  const [action, setAction] = useState<'update' | 'delete'>('update');
  const [filters, setFilters] = useState({
    houseId: initialFilters?.houseId || 'all',
    staffId: initialFilters?.staffId || 'all',
    shiftTypeId: 'all',
    status: 'all',
    startDate: initialFilters?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialFilters?.endDate || new Date().toISOString().split('T')[0],
  });

  const [updates, setUpdates] = useState({
    status: 'Scheduled',
  });

  const handleConfirm = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Please select a date range');
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm('ARE YOU ABSOLUTELY SURE? This will permanently delete all shifts matching your criteria. This action cannot be undone.');
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(filters, action, action === 'update' ? updates : undefined);
      toast.success(`Bulk ${action} completed successfully`);
      onClose();
    } catch (error: any) {
      console.error('Bulk action failed:', error);
      toast.error(`Failed to perform bulk ${action}: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Bulk Shift Management
          </DialogTitle>
          <DialogDescription>
            Manage multiple shifts at once across a date range and filters.
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

          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select value={action} onValueChange={(val: any) => setAction(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Update Status</SelectItem>
                <SelectItem value="delete">Delete Shifts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Filters (Targeting)</Label>
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
              <div className="space-y-2">
                <Label className="text-[10px] uppercase">Current Status</Label>
                <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {action === 'update' && (
            <div className="border-t pt-4 bg-primary/5 p-4 rounded-lg">
              <Label className="text-xs font-bold uppercase text-primary mb-3 block">New Value</Label>
              <div className="space-y-2">
                <Label>Target Status</Label>
                <Select value={updates.status} onValueChange={(val) => setUpdates({ ...updates, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {action === 'delete' && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-destructive">Destructive Action</p>
                <p className="text-[10px] text-destructive/80 leading-tight">
                  This will delete all shifts matching the filters above. Ensure your filters are correct.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant={action === 'delete' ? 'destructive' : 'primary'}
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : action === 'delete' ? (
              <Trash2 className="h-4 w-4 mr-2" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            {action === 'delete' ? 'Delete Shifts' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
