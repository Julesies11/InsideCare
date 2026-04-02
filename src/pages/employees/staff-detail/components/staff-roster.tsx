import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { ShiftCalendar } from '@/components/roster/shift-calendar';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { useRosterData, StaffShift, useShiftsQuery } from '@/components/roster/use-roster-data';
import { getDateRange, calculateDuration, ViewMode } from '@/components/roster/roster-utils';
import { NotificationService } from '@/lib/notification-service';

interface StaffRosterProps {
  staffId: string;
  canEdit: boolean;
}

export function StaffRoster({ staffId, canEdit }: StaffRosterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    houses,
    participants,
    staff,
    loading: metaLoading,
    createShift,
    updateShift,
    deleteShift,
    addShiftParticipant,
    removeShiftParticipant,
  } = useRosterData();

  const { startDate, endDate } = useMemo(() => {
    const range = getDateRange(currentDate, viewMode);
    return {
      startDate: format(range.startDate, 'yyyy-MM-dd'),
      endDate: format(range.endDate, 'yyyy-MM-dd')
    };
  }, [currentDate, viewMode]);

  const { shifts = [], isLoading: shiftsLoading } = useShiftsQuery(staffId, startDate, endDate);

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const matchesHouse = houseFilter === 'all' || shift.house_id === houseFilter;
      const matchesType = shiftTypeFilter === 'all' || shift.shift_type === shiftTypeFilter;
      return matchesHouse && matchesType;
    });
  }, [shifts, houseFilter, shiftTypeFilter]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'today') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'today') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (viewMode === 'week') {
      return `Week of ${format(currentDate, 'MMMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const handleAddShift = () => {
    setSelectedShift(null);
    setShowShiftDialog(true);
  };

  const handleEditShift = (shift: StaffShift) => {
    setSelectedShift(shift);
    setShowShiftDialog(true);
  };

  const handleSaveShift = async (formData: ShiftFormData) => {
    if (!formData.start_date || !formData.end_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (selectedShift) {
        // UPDATE EXISTING SHIFT
        const updates = {
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          house_id: formData.house_id || null,
          shift_type: formData.shift_type,
          status: formData.status,
          notes: formData.notes || null,
        };

        await updateShift(selectedShift.id, updates);

        const existingParticipantIds = selectedShift.participants?.map(p => p.id) || [];
        const toAdd = formData.participant_ids.filter(id => !existingParticipantIds.includes(id));
        const toRemove = existingParticipantIds.filter(id => !formData.participant_ids.includes(id));

        for (const participantId of toAdd) {
          await addShiftParticipant(selectedShift.id, participantId);
        }

        for (const participantId of toRemove) {
          await removeShiftParticipant(selectedShift.id, participantId);
        }

        // Get updated data for local state
        const house = formData.house_id ? houses.find(h => h.id === formData.house_id) : null;
        const shiftParticipants = formData.participant_ids
          .map(id => participants.find(p => p.id === id))
          .filter(p => p !== undefined) as typeof participants;

        // Update local state - NO LONGER NEEDED with TanStack Query
        // We just need to wait for the updateShift to complete, which invalidates the query

        toast.success('Shift updated successfully');
        
        const staffMember = staff.find(s => s.id === staffId);
        if (staffMember?.auth_user_id && formData.house_id) {
          const shiftHouse = houses.find(h => h.id === formData.house_id);
          if (shiftHouse) {
            await NotificationService.notifyShiftModified(staffMember.auth_user_id, formData.start_date, shiftHouse.name);
          }
        }

      } else {
        // CREATE NEW SHIFT
        const shiftData = {
          staff_id: staffId,
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          house_id: formData.house_id || null,
          shift_type: formData.shift_type,
          notes: formData.notes || null,
        };

        const data = await createShift(shiftData);

        if (!data) return;

        if (formData.participant_ids.length > 0) {
          for (const participantId of formData.participant_ids) {
            await addShiftParticipant(data.id, participantId);
          }
        }

        toast.success('Shift created successfully');
        
        const staffMember = staff.find(s => s.id === staffId);
        const house = formData.house_id ? houses.find(h => h.id === formData.house_id) : null;
        if (staffMember?.auth_user_id && house) {
          await NotificationService.notifyShiftAssigned(staffMember.auth_user_id, formData.start_date, house.name);
        }
      }
      setShowShiftDialog(false);
    } catch (error) {
      toast.error(selectedShift ? 'Failed to update shift' : 'Failed to create shift');
      console.error(error);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteShift(shiftId);
      toast.success('Shift deleted successfully');
      setShowShiftDialog(false);
    } catch (error) {
      toast.error('Failed to delete shift');
      console.error(error);
    }
  };

  return (
    <Card id="staff_roster">
      <CardHeader>
        <CardTitle>Roster</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RosterCalendarHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNavigate={navigatePeriod}
          getPeriodLabel={getPeriodLabel}
          showStaffFilter={false}
          showParticipantFilter={false}
          houseFilter={houseFilter}
          onHouseFilterChange={setHouseFilter}
          houseList={houses}
          shiftTypeFilter={shiftTypeFilter}
          onShiftTypeFilterChange={setShiftTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <ShiftCalendar
          staffId={staffId}
          viewMode={viewMode}
          currentDate={currentDate}
          shifts={filteredShifts}
          loading={shiftsLoading || metaLoading}
          canEdit={canEdit}
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
        />

        <ShiftDialog
          open={showShiftDialog}
          onOpenChange={setShowShiftDialog}
          shift={selectedShift}
          staffId={staffId}
          staffList={staff}
          staffSelectionDisabled={true}
          houses={houses}
          participants={participants}
          onSave={handleSaveShift}
          onDelete={selectedShift ? handleDeleteShift : undefined}
        />
      </CardContent>
    </Card>
  );
}
