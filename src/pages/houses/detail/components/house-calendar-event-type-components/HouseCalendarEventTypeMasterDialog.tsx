import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { HouseCalendarEventType } from '@/hooks/useHouseCalendarEvents';
import { useHouseCalendarEventTypesMaster, useAddHouseCalendarEventTypeMaster, useUpdateHouseCalendarEventTypeMaster } from '@/hooks/use-house-calendar-event-types-master';
import { HouseCalendarEventTypeMasterQuickAdd } from './HouseCalendarEventTypeMasterQuickAdd';
import { toast } from 'sonner';

interface HouseCalendarEventTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'name' | 'description' | 'status';
type SortDirection = 'asc' | 'desc';

export function HouseCalendarEventTypeMasterDialog({
  open,
  onClose,
  onUpdate,
}: HouseCalendarEventTypeMasterDialogProps) {
  const { data: eventTypes = [] } = useHouseCalendarEventTypesMaster();
  const { mutateAsync: addEventType } = useAddHouseCalendarEventTypeMaster();
  const { mutateAsync: updateEventType } = useUpdateHouseCalendarEventTypeMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEventType, setEditingEventType] = useState<HouseCalendarEventType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredEventTypes = useMemo(() => {
    const filtered = eventTypes.filter((type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField] || '';
      let bVal: string | number = b[sortField] || '';

      if (sortField === 'status') {
        aVal = a.status === 'Active' ? 1 : 0;
        bVal = b.status === 'Active' ? 1 : 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [eventTypes, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingEventType(null);
    setShowAddDialog(true);
  };

  const handleEdit = (eventType: HouseCalendarEventType) => {
    setEditingEventType(eventType);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (eventType: HouseCalendarEventType) => {
    const newStatus = eventType.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateEventType({ id: eventType.id, updates: { status: newStatus } });
      toast.success(`Event type ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to ${newStatus === 'Active' ? 'activate' : 'deactivate'} event type: ` + err.message);
    }
  };

  const handleSave = async (eventTypeData: Partial<HouseCalendarEventType>) => {
    try {
      if (editingEventType) {
        await updateEventType({ id: editingEventType.id, updates: eventTypeData });
        toast.success('Event type updated successfully');
      } else {
        await addEventType({
          name: eventTypeData.name!,
          description: eventTypeData.description || null,
          status: eventTypeData.status || 'Active',
          color: (eventTypeData as any).color || 'blue',
        });
        toast.success('Event type added successfully');
      }
      setShowAddDialog(false);
      onUpdate();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to ${editingEventType ? 'update' : 'add'} event type: ` + err.message);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="size-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Event Types</DialogTitle>
            <DialogDescription>
              View and manage the master list of calendar event types.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Search event types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd}>
              <Plus className="size-4 me-2" />
              Add Event Type
            </Button>
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-8 px-2"
                    >
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('description')}
                      className="h-8 px-2"
                    >
                      Description
                      {getSortIcon('description')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-8 px-2"
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredEventTypes.map((eventType) => (
                  <TableRow key={eventType.id}>
                    <TableCell className="font-medium">{eventType.name}</TableCell>
                    <TableCell>{eventType.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={eventType.status === 'Active' ? 'success' : 'secondary'}>
                        {eventType.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`size-4 rounded-full bg-${eventType.color}-500 border border-gray-200`} />
                        <span className="text-xs capitalize">{eventType.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(eventType)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(eventType)}
                        >
                          {eventType.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <HouseCalendarEventTypeMasterQuickAdd
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSave}
        eventType={editingEventType}
      />
    </>
  );
}
