import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { rosterApi } from '@/api/roster.api';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes.config';
import { useHouseShiftTemplates } from '@/hooks/use-house-shift-templates';
import { getDateRange, ViewMode } from '@/components/roster/roster-utils';
import { LeaveBlock, ShiftCalendar } from '@/components/roster/shift-calendar';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { StaffPersonalCalendar } from '@/components/roster/staff-personal-calendar';
import {
  StaffShift,
  useLeaveRequestsQuery,
  useRosterData,
  useShiftsQuery,
  useStaffAvailabilityQuery,
} from '@/components/roster/use-roster-data';
import { ViewLeaveDialog } from '@/components/roster/view-leave-dialog';
import { ViewShiftDialog } from '@/components/roster/view-shift-dialog';

export interface LeaveBlock {
  id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  leave_type_name: string;
  staff_id: string;
  reason?: string | null;
}

interface StaffRosterCalendarProps {
  staffId: string;
  viewMode: ViewMode;
  currentDate: Date;
  houseFilter: string;
  participantFilter: string;
  shiftTemplateFilter: string;
  canEdit: boolean;
  showLeave?: boolean;
  showAvailability?: boolean;
  onBulkAction?: (houseId: string) => void;
  onPopulateRoster?: (houseId: string) => void;
  checklists: any[];
  includeEvents?: boolean;
  isPersonal?: boolean;
  onEditLeave?: (leave: LeaveBlock) => void;
}

export interface StaffRosterCalendarHandle {
  copyPreviousWeek: (withAssignments?: boolean) => Promise<void>;
  rolloutRoster: (weeks: number, withAssignments?: boolean) => Promise<void>;
  applyTemplate: () => void;
  refresh: () => void;
  onAddShift: (date: Date, houseId?: string, shiftTemplateId?: string) => void;
  isCopying: boolean;
}

export const StaffRosterCalendar = forwardRef<
  StaffRosterCalendarHandle,
  StaffRosterCalendarProps
>(
  (
    {
      staffId,
      viewMode,
      currentDate,
      houseFilter,
      participantFilter,
      shiftTemplateFilter,
      canEdit,
      showLeave = false,
      showAvailability = false,
      onBulkAction,
      onPopulateRoster,
      checklists,
      includeEvents = false,
      isPersonal = false,
      onEditLeave,
    },
    ref,
  ) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const [showShiftDialog, setShowShiftDialog] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
    const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>(
      undefined,
    );
    const [preSelectedHouseId, setPreSelectedHouseId] = useState<
      string | undefined
    >(undefined);
    const [preSelectedShiftTemplateId, setPreSelectedShiftTemplateId] =
      useState<string | undefined>(undefined);

    const { shiftTemplates } = useHouseShiftTemplates(
      houseFilter !== 'all' ? houseFilter : undefined,
    );

    const [scrollToNotes, setScrollToNotes] = useState(false);

    const {
      houses,
      participants,
      staff,
      createShift,
      updateShift,
      deleteShift,
      addShiftParticipant,
      syncShiftParticipants,
      syncShiftChecklists,
    } = useRosterData(staffId);

    const { startDate, endDate } = useMemo(() => {
      return getDateRange(currentDate, viewMode);
    }, [currentDate, viewMode]);

    const { shifts = [], isLoading: shiftsLoading } = useShiftsQuery(
      staffId,
      startDate,
      endDate,
      houseFilter !== 'all' ? houseFilter : undefined,
      includeEvents,
    );

    const { data: leaveBlocks = [] } = useLeaveRequestsQuery(
      showLeave ? staffId : 'skip',
      startDate,
      endDate,
    );

    const { data: availabilityBlocks = [] } = useStaffAvailabilityQuery(
      staffId
    );

    const filteredShifts = useMemo(() => {
      return shifts
        .filter((shift) => {
          const matchesType =
            shiftTemplateFilter === 'all' ||
            shift.shift_template === shiftTemplateFilter;
          const matchesParticipant =
            participantFilter === 'all' ||
            (shift.participants &&
              shift.participants.some((p: any) => p.id === participantFilter));

          return matchesType && matchesParticipant;
        })
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }, [shifts, participantFilter, shiftTemplateFilter]);

    // Pre-compute a house → active staff Map to avoid O(n²) filter inside every calendar cell.
    // Note: today is re-computed on each render so the map stays accurate if the component
    // stays mounted past midnight and staff/house data updates.
    const houseStaffMap = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const map = new Map<string, typeof staff>();
      houses.forEach((house) => {
        const assigned = staff.filter((s) => {
          const assignments: Array<{
            house_id?: string;
            house?: { id: string };
            end_date?: string | null;
          }> = (s as any).house_assignments || [];
          return assignments.some((a) => {
            const assignmentHouseId = (
              a.house_id ||
              a.house?.id ||
              ''
            ).toLowerCase();
            const isTargetHouse = assignmentHouseId === house.id.toLowerCase();
            const isAssignmentActive = !a.end_date || a.end_date >= todayStr;
            return isTargetHouse && isAssignmentActive;
          });
        });
        map.set(house.id, assigned);
      });
      return map;
    }, [houses, staff]);

    const handleAddShift = (
      date: Date,
      houseId?: string,
      shiftTemplateId?: string,
    ) => {
      setSelectedShift(null);
      setPreSelectedDate(date);
      setPreSelectedHouseId(houseId);
      setPreSelectedShiftTemplateId(shiftTemplateId);
      setShowShiftDialog(true);
    };

    const handleEditShift = (shift: StaffShift) => {
      setSelectedShift(shift);
      setPreSelectedDate(undefined);
      setPreSelectedHouseId(undefined);
      setPreSelectedShiftTemplateId(undefined);
      setScrollToNotes(false);
      setShowShiftDialog(true);
    };

    const handleWriteNote = (shift: any) => {
      const firstParticipantId = shift.participants?.[0]?.id || '';
      navigate(
        `${ROUTES.SHIFT_NOTES_DETAIL}/new?shiftId=${shift.id}&staffId=${shift.staff_id || ''}&participantId=${firstParticipantId}`,
        {
          state: { from: location.pathname + location.search },
        },
      );
    };

    const handleNotesClick = (shift: StaffShift) => {
      setSelectedShift(shift);
      setPreSelectedDate(undefined);
      setPreSelectedHouseId(undefined);
      setPreSelectedShiftTemplateId(undefined);
      setScrollToNotes(true);
      setShowShiftDialog(true);
    };

    const handleEditLeave = (leave: LeaveBlock) => {
      if (onEditLeave) {
        onEditLeave(leave);
      } else {
        setSelectedLeaveId(leave.id);
        setShowLeaveDialog(true);
      }
    };

    const handleSaveShift = async (formData: ShiftFormData) => {
      setSaving(true);
      try {
        const { participant_ids, assigned_checklists, ...shiftData } = formData;
        let shiftId = selectedShift?.id;

        if (selectedShift) {
          await updateShift(selectedShift.id, shiftData);
          toast.success('Shift updated successfully');
        } else {
          const created = await createShift(shiftData);
          shiftId = created.id;
          toast.success('Shift created successfully');
        }

        if (shiftId) {
          await Promise.all([
            syncShiftParticipants(shiftId, participant_ids || []),
            syncShiftChecklists(shiftId, assigned_checklists || []),
          ]);
        }

        setShowShiftDialog(false);
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
      } catch (error: any) {
        console.error('Error deleting shift:', error);
        toast.error(error.message || 'Failed to delete shift');
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
        const sourceShifts = shifts.filter((s) => s.house_id === houseFilter);
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
            end_date: targetDate,
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_template: shift.shift_template,
            shift_template_id: shift.shift_template_id,
            notes: shift.notes || null,
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

        toast.success(
          `Successfully copied ${copiedCount} shifts to next week.`,
        );
      } catch (error) {
        console.error('Error copying week:', error);
        toast.error('Failed to copy week.');
      } finally {
        setIsCopying(false);
      }
    };

    const handleRolloutRoster = async (
      weeks: number,
      withAssignments: boolean = false,
    ) => {
      if (!houseFilter || houseFilter === 'all') {
        toast.error('Please select a specific house to rollout a roster.');
        return;
      }

      setIsCopying(true);
      try {
        const sourceShifts = shifts.filter((s) => s.house_id === houseFilter);
        if (sourceShifts.length === 0) {
          toast.info('No shifts found in the current week to rollout.');
          setIsCopying(false);
          return;
        }

        let totalCreated = 0;
        let skippedCount = 0;
        let leaveConflictCount = 0;

        const rolloutEndDate = format(
          addDays(parseISO(sourceShifts[0].start_date), weeks * 7 + 7),
          'yyyy-MM-dd',
        );
        const allLeave = await rosterApi.listApprovedLeaveForRollout(
          sourceShifts[0].start_date,
          rolloutEndDate,
        );

        for (let i = 1; i <= weeks; i++) {
          const daysOffset = i * 7;
          for (const shift of sourceShifts) {
            const sourceDate = parseISO(shift.start_date);
            const targetDateStr = format(
              addDays(sourceDate, daysOffset),
              'yyyy-MM-dd',
            );
            const targetEndDateStr = shift.end_date
              ? format(
                  addDays(parseISO(shift.end_date), daysOffset),
                  'yyyy-MM-dd',
                )
              : targetDateStr;

            const existing = await rosterApi.listShifts({
              houseId: houseFilter,
              startDate: targetDateStr,
              endDate: targetDateStr,
            });

            const isDuplicate = existing.some(
              (e) => e.start_time === shift.start_time,
            );

            if (isDuplicate) {
              skippedCount++;
              continue;
            }

            let targetStaffId = withAssignments ? shift.staff_id : null;
            if (targetStaffId && allLeave) {
              const onLeave = allLeave.some(
                (l) =>
                  l.staff_id === targetStaffId &&
                  targetDateStr >= l.start_date &&
                  targetDateStr <= l.end_date,
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
              shift_template: shift.shift_template,
              shift_template_id: shift.shift_template_id,
              notes: shift.notes || null,
            };

            const created = await createShift(newShiftData);
            if (created) {
              if (shift.participants) {
                for (const p of shift.participants) {
                  await addShiftParticipant(created.id, p.id);
                }
              }
              if (shift.assigned_checklists) {
                await syncShiftChecklists(
                  created.id,
                  shift.assigned_checklists,
                );
              }
              totalCreated++;
            }
          }
        }

        toast.success(
          `Rollout complete! Created ${totalCreated} shifts across ${weeks} weeks. ${skippedCount > 0 ? `(Skipped ${skippedCount} duplicates)` : ''} ${leaveConflictCount > 0 ? `Detected ${leaveConflictCount} leave conflicts (reverted to Open Shifts).` : ''}`,
        );
      } catch (error) {
        console.error('Error rolling out roster:', error);
        toast.error('Failed to rollout roster.');
      } finally {
        setIsCopying(false);
      }
    };

    const handleQuickAssign = async (
      shiftId: string,
      assignedStaffId: string,
    ) => {
      try {
        await updateShift(shiftId, { staff_id: assignedStaffId });
        toast.success('Staff assigned successfully');
      } catch (err) {
        console.error('Failed to quick assign staff:', err);
        toast.error('Failed to assign staff to shift.');
      }
    };

    useImperativeHandle(ref, () => ({
      copyPreviousWeek: handleCopyPreviousWeek,
      rolloutRoster: handleRolloutRoster,
      applyTemplate: () => {
        toast.info('Template system has been replaced by Build Roster tool.');
      },
      refresh: () => {
        queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
        queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      },
      onAddShift: handleAddShift,
      isCopying: isCopying,
    }));

    return (
      <>
        {isPersonal ? (
          <StaffPersonalCalendar
            staffId={staffId}
            viewMode={viewMode}
            currentDate={currentDate}
            shifts={filteredShifts}
            loading={shiftsLoading || isCopying || saving}
            canEdit={canEdit}
            leaveBlocks={showLeave ? (leaveBlocks as LeaveBlock[]) : []}
            availabilityBlocks={showAvailability ? availabilityBlocks : []}
            onAddShift={handleAddShift}
            onEditShift={handleEditShift}
            onWriteNote={handleWriteNote}
            onNotesClick={handleNotesClick}
            staffList={staff}
            onEditLeave={handleEditLeave}
          />
        ) : (
          <ShiftCalendar
            staffId={staffId}
            viewMode={viewMode}
            currentDate={currentDate}
            shifts={filteredShifts}
            loading={shiftsLoading || isCopying || saving}
            canEdit={canEdit}
            leaveBlocks={showLeave ? (leaveBlocks as LeaveBlock[]) : []}
            availabilityBlocks={availabilityBlocks}
            existingShifts={shifts}
            showAvailability={showAvailability}
            shiftTemplates={shiftTemplates}
            onAddShift={handleAddShift}
            onEditShift={handleEditShift}
            onWriteNote={handleWriteNote}
            onNotesClick={handleNotesClick}
            onBulkAction={onBulkAction}
            onPopulateRoster={onPopulateRoster}
            groupByHouse={staffId === 'all'}
            houses={
              houseFilter !== 'all'
                ? houses.filter((h) => h.id === houseFilter)
                : houses
            }
            staffList={staff}
            houseStaffMap={houseStaffMap}
            onQuickAssign={handleQuickAssign}
            onEditLeave={handleEditLeave}
          />
        )}

        <ViewLeaveDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          leaveId={selectedLeaveId}
        />

        {canEdit ? (
          <ShiftDialog
            open={showShiftDialog}
            onOpenChange={(open) => {
              setShowShiftDialog(open);
              if (!open) {
                setScrollToNotes(false);
              }
            }}
            shift={selectedShift}
            staffId={staffId !== 'all' ? staffId : undefined}
            preSelectedDate={preSelectedDate}
            preSelectedHouseId={preSelectedHouseId}
            preSelectedShiftTemplateId={preSelectedShiftTemplateId}
            staffList={staff}
            staffSelectionDisabled={false}
            houses={houses}
            participants={participants}
            checklists={checklists}
            onSave={handleSaveShift}
            onDelete={selectedShift ? handleDeleteShift : undefined}
            scrollToNotes={scrollToNotes}
            readOnly={false}
            allAvailabilityBlocks={availabilityBlocks}
            allLeaveBlocks={leaveBlocks}
            allShifts={shifts}
          />
        ) : (
          <ViewShiftDialog
            open={showShiftDialog}
            onOpenChange={setShowShiftDialog}
            shift={selectedShift}
            onWriteNote={handleWriteNote}
          />
        )}
      </>
    );
  },
);
