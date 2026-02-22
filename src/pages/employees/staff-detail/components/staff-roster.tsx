import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { ShiftCalendar } from '@/components/roster/shift-calendar';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { useRosterData, StaffShift } from '@/components/roster/use-roster-data';
import { getDateRange, calculateDuration, ViewMode } from '@/components/roster/roster-utils';

interface StaffRosterProps {
  staffId: string;
  canEdit: boolean;
}

export function StaffRoster({ staffId, canEdit }: StaffRosterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    houses,
    participants,
    staff,
    loading,
    loadAllData,
    loadShifts,
    createShift,
    updateShift,
    deleteShift,
    addShiftParticipant,
    removeShiftParticipant,
  } = useRosterData();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const fetchShifts = async () => {
      const { startDate, endDate } = getDateRange(currentDate, viewMode);
      const data = await loadShifts(staffId, startDate, endDate);
      setShifts(data);
    };
    fetchShifts();
  }, [staffId, currentDate, viewMode, loadShifts]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const matchesHouse = houseFilter === 'all' || shift.house_id === houseFilter;
      const matchesType = shiftTypeFilter === 'all' || shift.shift_type === shiftTypeFilter;
      const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;
      return matchesHouse && matchesType && matchesStatus;
    });
  }, [shifts, houseFilter, shiftTypeFilter, statusFilter]);

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

  const handleAddShift = (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(null);
    setShowShiftDialog(true);
  };

  const handleEditShift = (shift: StaffShift) => {
    setSelectedShift(shift);
    setSelectedDate(null);
    setShowShiftDialog(true);
  };

  const handleSaveShift = async (formData: ShiftFormData) => {
    if (!formData.shift_date || !formData.end_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (selectedShift) {
        // UPDATE EXISTING SHIFT
        const updates = {
          shift_date: formData.shift_date,
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

        // Update local state
        setShifts(prevShifts => prevShifts.map(shift => 
          shift.id === selectedShift.id 
            ? {
                ...shift,
                ...updates,
                house: house ? { id: house.id, name: house.name } : undefined,
                participants: shiftParticipants,
                duration_hours: calculateDuration(updates.start_time, updates.end_time, updates.shift_date, updates.end_date),
              }
            : shift
        ));

        toast.success('Shift updated successfully');
      } else {
        // CREATE NEW SHIFT
        const shiftData = {
          staff_id: staffId,
          shift_date: formData.shift_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          house_id: formData.house_id || null,
          shift_type: formData.shift_type,
          status: formData.status,
          notes: formData.notes || null,
        };

        const data = await createShift(shiftData);

        if (!data) return;

        if (formData.participant_ids.length > 0) {
          for (const participantId of formData.participant_ids) {
            await addShiftParticipant(data.id, participantId);
          }
        }

        // Get data for local state
        const house = formData.house_id ? houses.find(h => h.id === formData.house_id) : null;
        const shiftParticipants = formData.participant_ids
          .map(id => participants.find(p => p.id === id))
          .filter(p => p !== undefined) as typeof participants;

        // Add to local state
        const newShift: StaffShift = {
          ...data,
          house: house ? { id: house.id, name: house.name } : undefined,
          participants: shiftParticipants,
          duration_hours: calculateDuration(data.start_time, data.end_time, data.shift_date, data.end_date ?? data.shift_date),
        };

        setShifts(prevShifts => [...prevShifts, newShift]);

        toast.success('Shift created successfully');
      }
    } catch (error) {
      toast.error(selectedShift ? 'Failed to update shift' : 'Failed to create shift');
      console.error(error);
      throw error;
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await deleteShift(shiftId);
      setShifts(prevShifts => prevShifts.filter(shift => shift.id !== shiftId));
      toast.success('Shift deleted successfully');
    } catch (error) {
      toast.error('Failed to delete shift');
      console.error(error);
      throw error;
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
          currentDate={currentDate}
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
          loading={loading}
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
