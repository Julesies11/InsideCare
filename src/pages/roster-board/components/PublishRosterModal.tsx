import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useHouses } from '@/hooks/use-houses';
import { useShiftTemplates } from '@/hooks/use-shift-templates';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PublishRosterModalProps {
  open: boolean;
  onClose: () => void;
  // Optional source house for templates; if not provided, user must select one
  sourceHouseId?: string;
  onPublish: (params: {
    templateId: string;
    houseIds: string[];
    startDate: string;
    endDate: string;
    withAssignments?: boolean;
  }) => Promise<void>;
}

export function PublishRosterModal({
  open,
  onClose,
  sourceHouseId: initialSourceHouseId,
  onPublish,
}: PublishRosterModalProps) {
  // Fetch all houses (paginated with large page size)
  const { houses: housesData, loading: housesLoading } = useHouses(0, 1000, [], {});
  // Stabilise array reference so auto-select effect doesn't fire on every render
  const houses = useMemo(() => housesData ?? [], [housesData]);

  // Source house for templates
  const [sourceHouseId, setSourceHouseId] = useState<string>(initialSourceHouseId || '');
  // Templates for the selected source house
  const { groups: templates = [], isLoading: templatesLoading } = useShiftTemplates(sourceHouseId || undefined);

  // UI state
  const [selectedHouseIds, setSelectedHouseIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [withAssignments, setWithAssignments] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Reset when modal opens — compute dates from today at effect runtime, not as a prop default
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (open) {
      const today = new Date();
      setSourceHouseId(initialSourceHouseId || '');
      setSelectedHouseIds([]);
      setTemplateId('');
      setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setWithAssignments(false);
      hasAutoSelected.current = false;
    }
  }, [open, initialSourceHouseId]);

  // Auto‑select first source house if none provided and houses are loaded
  useEffect(() => {
    if (!open) return;
    if (!sourceHouseId && houses.length > 0 && !hasAutoSelected.current) {
      hasAutoSelected.current = true;
      setSourceHouseId(houses[0].id);
    }
  }, [open, houses, sourceHouseId]);

  const handleToggleHouse = (houseId: string) => {
    setSelectedHouseIds(prev =>
      prev.includes(houseId)
        ? prev.filter(id => id !== houseId)
        : [...prev, houseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedHouseIds.length === activeHouses.length) {
      setSelectedHouseIds([]);
    } else {
      setSelectedHouseIds(activeHouses.map(h => h.id));
    }
  };

  const handlePublish = async () => {
    if (!templateId) {
      toast.error('Please select a template to apply.');
      return;
    }
    if (selectedHouseIds.length === 0) {
      toast.error('Please select at least one target house.');
      return;
    }
    if (!sourceHouseId) {
      toast.error('Please select a source house for the template.');
      return;
    }

    try {
      setIsPublishing(true);
      await onPublish({
        templateId,
        houseIds: selectedHouseIds,
        startDate,
        endDate,
        withAssignments,
      });
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsPublishing(false);
    }
  };

  const activeHouses = houses.filter((h: any) => h.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Publish Roster to Multiple Houses
          </DialogTitle>
          <DialogDescription>
            Apply a shift template to multiple houses across a date range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source House & Template Selection */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Source House (for template)</Label>
              <Select value={sourceHouseId} onValueChange={setSourceHouseId} disabled={!!initialSourceHouseId}>
                <SelectTrigger>
                  <SelectValue placeholder={housesLoading ? 'Loading houses...' : 'Select a house'} />
                </SelectTrigger>
                <SelectContent>
                  {activeHouses.map((house: any) => (
                    <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the house whose template you want to use.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Shift Template</Label>
              <Select value={templateId} onValueChange={setTemplateId} disabled={!sourceHouseId || templatesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !sourceHouseId
                      ? 'Select a source house first'
                      : templatesLoading
                        ? 'Loading templates...'
                        : 'Choose a template'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Template will be applied to selected target houses.
              </p>
            </div>
          </div>

          {/* Target Houses Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Target Houses</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll} disabled={housesLoading}>
                {selectedHouseIds.length === activeHouses.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border rounded-md">
              {activeHouses.map((house: any) => (
                <div key={house.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`house-${house.id}`}
                    checked={selectedHouseIds.includes(house.id)}
                    onCheckedChange={() => handleToggleHouse(house.id)}
                  />
                  <Label htmlFor={`house-${house.id}`} className="cursor-pointer font-normal">
                    {house.name}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedHouseIds.length} of {activeHouses.length} houses selected.
            </p>
          </div>

          {/* Date Range */}
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

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="withAssignments"
                checked={withAssignments}
                onCheckedChange={(checked) => setWithAssignments(checked === true)}
              />
              <Label htmlFor="withAssignments" className="cursor-pointer">
                Copy existing staff assignments (if any)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, any staff assignments from the source template will be copied to the new shifts.
            </p>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 p-6 -m-6 mt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPublishing}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !templateId || selectedHouseIds.length === 0}
            className="px-8 font-bold"
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish to Selected Houses'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
