import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ShiftCalendar } from '@/components/roster/shift-calendar';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { useRosterData, StaffShift } from '@/components/roster/use-roster-data';
import { getDateRange, calculateDuration, ViewMode } from '@/components/roster/roster-utils';

interface StaffRosterCalendarProps {
  staffId: string;
  viewMode: ViewMode;
  currentDate: Date;
  houseFilter: string;
  participantFilter: string;
  shiftTypeFilter: string;
  statusFilter: string;
  canEdit: boolean;
}

export function StaffRosterCalendar({
  staffId,
  viewMode,
  currentDate,
  houseFilter,
  participantFilter,
  shiftTypeFilter,
  statusFilter,
  canEdit,
}: StaffRosterCalendarProps) {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
      const matchesParticipant = participantFilter === 'all' || 
        shift.participants?.some(p => p.id === participantFilter);
      return matchesHouse && matchesType && matchesStatus && matchesParticipant;
    });
  }, [shifts, houseFilter, participantFilter, shiftTypeFilter, statusFilter]);

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
    if (!formData.staff_id || !formData.shift_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields including staff member');
      return;
    }

    try {
      if (selectedShift) {
        // UPDATE EXISTING SHIFT
        const updates = {
          staff_id: formData.staff_id,
          shift_date: formData.shift_date,
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
        const staffMember = staff.find(s => s.id === formData.staff_id);

        // Update local state
        setShifts(prevShifts => prevShifts.map(shift => 
          shift.id === selectedShift.id 
            ? {
                ...shift,
                ...updates,
                house: house ? { id: house.id, name: house.name } : undefined,
                participants: shiftParticipants,
                staff_name: staffMember?.name || 'Unassigned',
                duration_hours: calculateDuration(updates.start_time, updates.end_time),
              }
            : shift
        ));

        toast.success('Shift updated successfully');
      } else {
        // CREATE NEW SHIFT
        const shiftData = {
          staff_id: formData.staff_id,
          shift_date: formData.shift_date,
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
        const staffMember = staff.find(s => s.id === formData.staff_id);

        // Add to local state
        const newShift: StaffShift = {
          ...data,
          house: house ? { id: house.id, name: house.name } : undefined,
          participants: shiftParticipants,
          staff_name: staffMember?.name || 'Unassigned',
          duration_hours: calculateDuration(data.start_time, data.end_time),
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
    <>
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
        staffId={staffId !== 'all' ? staffId : undefined}
        staffList={staff}
        staffSelectionDisabled={false}
        houses={houses}
        participants={participants}
        onSave={handleSaveShift}
        onDelete={selectedShift ? handleDeleteShift : undefined}
      />
    </>
  );
}
