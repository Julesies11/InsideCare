import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { format, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ShiftCalendar } from '@/components/roster/shift-calendar';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { StaffShift, useRosterData } from '@/components/roster/use-roster-data';
import { getDateRange, ViewMode } from '@/components/roster/roster-utils';
import { EditShiftNoteDialog } from '@/pages/participants/shift-notes/components/edit-shift-note-dialog';
import { useShiftNotes } from '@/hooks/use-shift-notes';
import { supabase } from '@/lib/supabase';
import { ApplyShiftTemplateModal } from './ApplyShiftTemplateModal';
import { useShiftTemplates } from '@/hooks/use-shift-templates';
import { useHouseShiftTypes } from '@/hooks/use-house-shift-types';

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
  canEdit: boolean;
  showLeave?: boolean;
  groupByHouse?: boolean;
  onBulkAction?: (houseId: string) => void;
  onPopulateRoster?: (houseId: string) => void;
  checklists: any[];
}

export interface StaffRosterCalendarHandle {
  copyPreviousWeek: (withAssignments?: boolean) => Promise<void>;
  rolloutRoster: (weeks: number, withAssignments?: boolean) => Promise<void>;
  applyTemplate: () => void;
  refresh: () => void;
  onAddShift: (date: Date, houseId?: string, shiftTypeId?: string) => void;
  isCopying: boolean;
}

export const StaffRosterCalendar = forwardRef<StaffRosterCalendarHandle, StaffRosterCalendarProps>(({
  staffId,
  viewMode,
  currentDate,
  houseFilter,
  participantFilter,
  shiftTypeFilter,
  statusFilter,
  canEdit,
  showLeave = true,
  groupByHouse = false,
  onBulkAction,
  onPopulateRoster,
  checklists,
}, ref) => {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [leaveBlocks, setLeaveBlocks] = useState<LeaveBlock[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>(undefined);
  const [preSelectedHouseId, setPreSelectedHouseId] = useState<string | undefined>(undefined);
  const [preSelectedShiftTypeId, setPreSelectedShiftTypeId] = useState<string | undefined>(undefined);

  // Write Note state
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [notePreFillShiftId, setNotePreFillShiftId] = useState<string | null>(null);
  const [notePreFillLinkedShift, setNotePreFillLinkedShift] = useState<{
    id: string; start_time: string; end_time: string; shift_type: string; status: string;
  } | null>(null);
  const [notePreFillData, setNotePreFillData] = useState<{
    staff_id?: string | null;
    start_date?: string;
    house_id?: string | null;
    shift_time?: string | null;
  }>({});

  const { createShiftNote, refetch: refetchNotes, fetchShiftNotesByShiftId } = useShiftNotes();

  const { shiftTypes } = useHouseShiftTypes(houseFilter !== 'all' ? houseFilter : undefined);
  const { groups: templates } = useShiftTemplates(houseFilter !== 'all' ? houseFilter : undefined);

  // notes count map: shiftId -> count
  const [notesCounts, setNotesCounts] = useState<Record<string, number>>({});
  const [scrollToNotes, setScrollToNotes] = useState(false);

  const {
    houses,
    participants,
    staff,
    loading,
    loadHouses,
    loadParticipants,
    loadStaff,
    loadAllData,
    loadShifts,
    createShift,
    updateShift,
    deleteShift,
    addShiftParticipant,
    removeShiftParticipant,
    syncShiftChecklists,
    materializeTemplate,
  } = useRosterData();

  const refreshShifts = useCallback(async () => {
    const { startDate, endDate } = getDateRange(currentDate, viewMode);
    const data = await loadShifts(staffId, startDate, endDate, houseFilter);
    setShifts(data);
  }, [staffId, currentDate, viewMode, loadShifts, houseFilter]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    refreshShifts();
  }, [refreshShifts]);

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
        (data || []).map((r: { id: string; start_date: string; end_date: string; status: 'pending' | 'approved' | 'rejected'; leave_type?: { name: string }; staff_id: string }) => ({
          id: r.id,
          start_date: r.start_date,
          end_date: r.end_date,
          status: r.status as 'pending' | 'approved' | 'rejected',
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
    if (shifts.length > 0) {
      fetchNotesCounts(shifts.map(s => s.id));
    }
  }, [shifts, fetchNotesCounts]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const matchesHouse = houseFilter === 'all' || shift.house_id === houseFilter;
      const matchesType = shiftTypeFilter === 'all' || shift.shift_type === shiftTypeFilter;
      const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;
      const matchesParticipant = participantFilter === 'all' || (shift.participants && shift.participants.some((p: any) => p.id === participantFilter));
      
      return matchesHouse && matchesType && matchesStatus && matchesParticipant;
    }).map(shift => ({ ...shift, notesCount: notesCounts[shift.id] ?? 0 }))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [shifts, houseFilter, participantFilter, shiftTypeFilter, statusFilter, notesCounts]);

  const handleAddShift = (date: Date, houseId?: string, shiftTypeId?: string) => {
    setSelectedShift(null);
    setPreSelectedDate(date);
    setPreSelectedHouseId(houseId);
    setPreSelectedShiftTypeId(shiftTypeId);
    setShowShiftDialog(true);
  };

  const handleApplyTemplateToDate = async (templateId: string, date: Date, houseId: string) => {
    setIsCopying(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const result = await materializeTemplate({
        templateId,
        houseId,
        startDate: dateStr,
        endDate: dateStr
      });
      
      toast.success(`Applied template to ${dateStr}. Created ${result.created} shifts.`);
      refreshShifts();
    } catch (err) {
      console.error('Error applying template:', err);
      toast.error('Failed to apply template.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleEditShift = (shift: StaffShift) => {
    setSelectedShift(shift);
    setPreSelectedDate(undefined);
    setPreSelectedHouseId(undefined);
    setPreSelectedShiftTypeId(undefined);
    setScrollToNotes(false);
    setShowShiftDialog(true);
  };

  const handleWriteNote = (shift: any) => {
    setNotePreFillShiftId(shift.id);
    setNotePreFillLinkedShift(shift);
    setNotePreFillData({
      staff_id: shift.staff_id,
      start_date: shift.start_date,
      house_id: shift.house_id,
      shift_time: shift.start_time,
    });
    setShowNoteDialog(true);
  };

  const handleNotesClick = (shift: StaffShift) => {
    setSelectedShift(shift);
    setPreSelectedDate(undefined);
    setPreSelectedHouseId(undefined);
    setPreSelectedShiftTypeId(undefined);
    setScrollToNotes(true);
    setShowShiftDialog(true);
  };

  const handleSaveShift = async (formData: ShiftFormData) => {
    setSaving(true);
    try {
      if (selectedShift) {
        await updateShift(selectedShift.id, formData);
        toast.success('Shift updated successfully');
      } else {
        await createShift(formData);
        toast.success('Shift created successfully');
      }
      setShowShiftDialog(false);
      refreshShifts();
    } catch (error) {
      console.error('Error saving shift:', error);
      toast.error('Failed to save shift');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    setSaving(true);
    try {
      await deleteShift(shiftId);
      toast.success('Shift deleted successfully');
      setShowShiftDialog(false);
      refreshShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPreviousWeek = async (withAssignments: boolean = false) => {
    if (!houseFilter || houseFilter === 'all') {
      toast.error('Please select a specific house to copy a roster.');
      return;
    }

    const confirmMsg = `Push this week's structure to the next week? ${withAssignments ? '(Including staff assignments)' : '(Skeleton only)'}`;
    if (!confirm(confirmMsg)) return;

    setIsCopying(true);
    try {
      const sourceShifts = shifts.filter(s => s.house_id === houseFilter);
      if (sourceShifts.length === 0) {
        toast.info('No shifts found in the current week to copy.');
        return;
      }

      let copiedCount = 0;
      for (const shift of sourceShifts) {
        const sourceDate = parseISO(shift.start_date);
        const targetDate = format(addDays(sourceDate, 7), 'yyyy-MM-dd');
        
        const newShiftData = {
          staff_id: withAssignments ? shift.staff_id : null,
          house_id: houseFilter,
          start_date: targetDate,
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_type: shift.shift_type,
          status: 'Scheduled',
        };

        const created = await createShift(newShiftData);
        if (created) {
          if (shift.participants) {
            for (const p of shift.participants) {
              await addShiftParticipant(created.id, p.id);
            }
          }
          copiedCount++;
        }
      }

      toast.success(`Successfully copied ${copiedCount} shifts to next week.`);
      refreshShifts();
    } catch (error) {
      console.error('Error copying week:', error);
      toast.error('Failed to copy week.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleRolloutRoster = async (weeks: number, withAssignments: boolean = false) => {
    if (!houseFilter || houseFilter === 'all') {
      toast.error('Please select a specific house to rollout a roster.');
      return;
    }

    setIsCopying(true);
    try {
      const sourceShifts = shifts.filter(s => s.house_id === houseFilter);
      if (sourceShifts.length === 0) {
        toast.info('No shifts found in the current week to rollout.');
        setIsCopying(false);
        return;
      }

      let totalCreated = 0;
      let skippedCount = 0;
      let leaveConflictCount = 0;

      const rolloutEndDate = format(addDays(parseISO(sourceShifts[0].start_date), (weeks * 7) + 7), 'yyyy-MM-dd');
      const { data: allLeave } = await supabase
        .from('leave_requests')
        .select('staff_id, start_date, end_date')
        .eq('status', 'approved')
        .gte('end_date', sourceShifts[0].start_date)
        .lte('start_date', rolloutEndDate);

      for (let i = 1; i <= weeks; i++) {
        const daysOffset = i * 7;
        for (const shift of sourceShifts) {
          const sourceDate = parseISO(shift.start_date);
          const targetDateStr = format(addDays(sourceDate, daysOffset), 'yyyy-MM-dd');
          const targetEndDateStr = shift.end_date ? format(addDays(parseISO(shift.end_date), daysOffset), 'yyyy-MM-dd') : targetDateStr;

          const { data: existing } = await supabase
            .from('staff_shifts')
            .select('id')
            .eq('house_id', houseFilter)
            .eq('start_date', targetDateStr)
            .eq('start_time', shift.start_time)
            .maybeSingle();

          if (existing) {
            skippedCount++;
            continue;
          }

          let targetStaffId = withAssignments ? shift.staff_id : null;
          if (targetStaffId && allLeave) {
            const onLeave = allLeave.some(l => 
              l.staff_id === targetStaffId && 
              targetDateStr >= l.start_date && 
              targetDateStr <= l.end_date
            );
            
            if (onLeave) {
              targetStaffId = null; 
              leaveConflictCount++;
            }
          }

          const newShiftData = {
            staff_id: targetStaffId,
            house_id: houseFilter,
            start_date: targetDateStr,
            end_date: targetEndDateStr,
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_type: shift.shift_type,
            status: 'Scheduled',
            notes: null,
          };

          const created = await createShift(newShiftData);
          if (created) {
            if (shift.participants) {
              for (const p of shift.participants) {
                await addShiftParticipant(created.id, p.id);
              }
            }
            if (shift.assigned_checklists) {
              await syncShiftChecklists(created.id, shift.assigned_checklists);
            }
            totalCreated++;
          }
        }
      }

      toast.success(`Rollout complete! Created ${totalCreated} shifts across ${weeks} weeks. ${skippedCount > 0 ? `(Skipped ${skippedCount} duplicates)` : ''} ${leaveConflictCount > 0 ? `Detected ${leaveConflictCount} leave conflicts (reverted to Open Shifts).` : ''}`);
      refreshShifts();
    } catch (error) {
      console.error('Error rolling out roster:', error);
      toast.error('Failed to rollout roster.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleApplyShiftTemplate = async (templateId: string, startDate: string, endDate: string) => {
    if (!houseFilter || houseFilter === 'all') {
      toast.error('Please select a specific house to apply a template.');
      return;
    }

    setIsCopying(true);
    try {
      const result = await materializeTemplate({
        templateId,
        houseId: houseFilter,
        startDate,
        endDate
      });

      toast.success(`Template applied! Created ${result.created} shifts. ${result.skipped > 0 ? `(Skipped ${result.skipped} duplicates)` : ''}`);
      refreshShifts();
    } catch (err) {
      console.error('Error applying template:', err);
      toast.error('Failed to apply shift template.');
    } finally {
      setIsCopying(false);
    }
  };

  const triggerApplyTemplate = () => setShowApplyTemplateModal(true);

  useImperativeHandle(ref, () => ({
    copyPreviousWeek: handleCopyPreviousWeek,
    rolloutRoster: handleRolloutRoster,
    applyTemplate: triggerApplyTemplate,
    refresh: refreshShifts,
    onAddShift: handleAddShift,
    isCopying: isCopying
  }));

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
        shiftTypes={shiftTypes}
        templates={templates}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
        onWriteNote={handleWriteNote}
        onNotesClick={handleNotesClick}
        onApplyTemplate={handleApplyTemplateToDate}
        onBulkAction={onBulkAction}
        onPopulateRoster={onPopulateRoster}
        groupByHouse={groupByHouse}
        houses={houses}
      />

      <ApplyShiftTemplateModal
        open={showApplyTemplateModal}
        onClose={() => setShowApplyTemplateModal(false)}
        houseId={houseFilter}
        onApply={handleApplyShiftTemplate}
        initialDate={currentDate}
      />

      <ShiftDialog
        open={showShiftDialog}
        onOpenChange={(open) => {
          setShowShiftDialog(open);
          if (!open) {
            if (selectedShift) fetchNotesCounts([selectedShift.id]);
            setScrollToNotes(false);
          }
        }}
        shift={selectedShift}
        staffId={staffId !== 'all' ? staffId : undefined}
        preSelectedDate={preSelectedDate}
        preSelectedHouseId={preSelectedHouseId}
        preSelectedShiftTypeId={preSelectedShiftTypeId}
        staffList={staff}
        staffSelectionDisabled={false}
        houses={houses}
        participants={participants}
        checklists={checklists}
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
});
