import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ShiftCalendar } from '@/components/roster/shift-calendar';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { ShiftCardData } from '@/components/roster/shift-card';
import { useRosterData, StaffShift } from '@/components/roster/use-roster-data';
import { getDateRange, calculateDuration, ViewMode } from '@/components/roster/roster-utils';
import { EditShiftNoteDialog } from '@/pages/participants/shift-notes/components/edit-shift-note-dialog';
import { useShiftNotes } from '@/hooks/useShiftNotes';
import { supabase } from '@/lib/supabase';
import { eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';

export interface LeaveBlock {
  id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  leave_type_name: string;
  staff_id: string;
}

interface StaffRosterCalendarProps {
  staffId: string;
  viewMode: ViewMode;
  currentDate: Date;
  houseFilter: string;
  participantFilter: string;
  shiftTypeFilter: string;
  statusFilter: string;
  canEdit: boolean;
  showLeave?: boolean;
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
  showLeave = true,
}: StaffRosterCalendarProps) {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [leaveBlocks, setLeaveBlocks] = useState<LeaveBlock[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Write Note state
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [notePreFillShiftId, setNotePreFillShiftId] = useState<string | null>(null);
  const [notePreFillLinkedShift, setNotePreFillLinkedShift] = useState<{
    id: string; start_time: string; end_time: string; shift_type: string; status: string;
  } | null>(null);
  const [notePreFillData, setNotePreFillData] = useState<{
    staff_id?: string | null;
    shift_date?: string;
    house_id?: string | null;
    shift_time?: string | null;
  }>({});

  const { createShiftNote, refetch: refetchNotes, fetchShiftNotesByShiftId } = useShiftNotes();

  // notes count map: shiftId -> count
  const [notesCounts, setNotesCounts] = useState<Record<string, number>>({});
  const [scrollToNotes, setScrollToNotes] = useState(false);

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

  useEffect(() => {
    if (!showLeave || !staffId || staffId === 'all') return;
    const fetchLeave = async () => {
      const { startDate, endDate } = getDateRange(currentDate, viewMode);
      const query = supabase
        .from('leave_requests')
        .select('id, start_date, end_date, status, leave_type:leave_types(name), staff_id')
        .neq('status', 'rejected')
        .lte('start_date', endDate)
        .gte('end_date', startDate);
      if (staffId !== 'all') query.eq('staff_id', staffId);
      const { data } = await query;
      setLeaveBlocks(
        (data || []).map((r: any) => ({
          id: r.id,
          start_date: r.start_date,
          end_date: r.end_date,
          status: r.status,
          leave_type_name: r.leave_type?.name ?? 'Leave',
          staff_id: r.staff_id,
        }))
      );
    };
    fetchLeave();
  }, [staffId, currentDate, viewMode, showLeave]);

  const fetchNotesCounts = useCallback(async (shiftIds: string[]) => {
    if (shiftIds.length === 0) return;
    const results = await Promise.all(
      shiftIds.map(async (id) => {
        const notes = await fetchShiftNotesByShiftId(id);
        return { id, count: notes.length };
      })
    );
    setNotesCounts(prev => {
      const next = { ...prev };
      results.forEach(({ id, count }) => { next[id] = count; });
      return next;
    });
  }, [fetchShiftNotesByShiftId]);

  useEffect(() => {
    if (shifts.length > 0 && canEdit) {
      fetchNotesCounts(shifts.map(s => s.id));
    }
  }, [shifts, fetchNotesCounts, canEdit]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {

      const matchesHouse = houseFilter === 'all' || shift.house_id === houseFilter;
      const matchesType = shiftTypeFilter === 'all' || shift.shift_type === shiftTypeFilter;
      const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;
      const matchesParticipant = participantFilter === 'all' || 
        shift.participants?.some(p => p.id === participantFilter);
      return matchesHouse && matchesType && matchesStatus && matchesParticipant;
    }).map(shift => ({ ...shift, notesCount: notesCounts[shift.id] ?? 0 }));
  }, [shifts, houseFilter, participantFilter, shiftTypeFilter, statusFilter, notesCounts]);

  const handleAddShift = (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(null);
    setShowShiftDialog(true);
  };

  const handleEditShift = (shift: StaffShift) => {
    setSelectedShift(shift);
    setSelectedDate(null);
    setScrollToNotes(false);
    setShowShiftDialog(true);
  };

  const handleNotesClick = (shift: ShiftCardData) => {
    const fullShift = shifts.find(s => s.id === shift.id) || null;
    setSelectedShift(fullShift);
    setSelectedDate(null);
    setScrollToNotes(true);
    setShowShiftDialog(true);
  };

  const handleSaveShift = async (formData: ShiftFormData): Promise<{ id: string } | void> => {
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
        return { id: data.id };
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

  const handleWriteNote = (shift: ShiftCardData) => {
    setNotePreFillShiftId(shift.id);
    setNotePreFillLinkedShift({
      id: shift.id,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      status: shift.status,
    });
    setNotePreFillData({
      staff_id: shift.staff_id || null,
      shift_date: shift.shift_date,
      house_id: shift.house?.id || null,
      shift_time: shift.start_time,
    });
    setShowNoteDialog(true);
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
        leaveBlocks={showLeave ? leaveBlocks : []}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
        onWriteNote={handleWriteNote}
        onNotesClick={handleNotesClick}
      />

      <ShiftDialog
        open={showShiftDialog}
        onOpenChange={(open) => {
          setShowShiftDialog(open);
          if (!open) {
            // Refresh notes counts when dialog closes (notes may have been added)
            if (selectedShift) fetchNotesCounts([selectedShift.id]);
            setScrollToNotes(false);
          }
        }}
        shift={selectedShift}
        staffId={staffId !== 'all' ? staffId : undefined}
        staffList={staff}
        staffSelectionDisabled={false}
        houses={houses}
        participants={participants}
        onSave={handleSaveShift}
        onDelete={selectedShift ? handleDeleteShift : undefined}
        scrollToNotes={scrollToNotes}
        readOnly={!canEdit}
      />

      <EditShiftNoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        shiftNote={null}
        onCreate={async (data) => createShiftNote({ ...data, ...notePreFillData, shift_id: notePreFillShiftId })}
        onSave={async () => ({ data: null, error: 'Not applicable' })}
        onSuccess={() => refetchNotes(true)}
        mode="create"
        initialShiftId={notePreFillShiftId}
        initialLinkedShift={notePreFillLinkedShift}
      />
    </>
  );
}
