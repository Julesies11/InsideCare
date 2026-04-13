import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { ShiftCalendar } from '@/components/roster/shift-calendar';
import { ShiftDialog, ShiftFormData } from '@/components/roster/shift-dialog';
import { LeaveDialog } from '@/components/roster/leave-dialog';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { useRosterData, StaffShift, useShiftsQuery, useLeaveRequestsQuery } from '@/components/roster/use-roster-data';
import { getDateRange, calculateDuration, ViewMode } from '@/components/roster/roster-utils';
import { NotificationService } from '@/lib/notification-service';
import { useQueryClient } from '@tanstack/react-query';

interface StaffRosterProps {
  staffId: string;
  canEdit: boolean;
}

export function StaffRoster({ staffId, canEdit }: StaffRosterProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<StaffShift | null>(null);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [shiftTemplateFilter, setShiftTemplateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showLeave, setShowLeave] = useState<boolean>(false);

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
    return getDateRange(currentDate, viewMode);
  }, [currentDate, viewMode]);

  const { shifts = [], isLoading: shiftsLoading } = useShiftsQuery(staffId, startDate, endDate);
  const { data: leaveBlocks = [] } = useLeaveRequestsQuery(staffId, startDate, endDate);

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const matchesHouse = houseFilter === 'all' || shift.house_id === houseFilter;
      const matchesType = shiftTemplateFilter === 'all' || shift.shift_template === shiftTemplateFilter;
      return matchesHouse && matchesType;
    });
  }, [shifts, houseFilter, shiftTemplateFilter]);

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

  const handleEditLeave = (leave: any) => {
    setSelectedLeaveId(leave.id);
    setShowLeaveDialog(true);
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
          shift_template: formData.shift_template,
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
        const newShift = {
          staff_id: staffId,
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          house_id: formData.house_id || null,
          shift_template: formData.shift_template,
          status: formData.status,
          notes: formData.notes || null,
        };

        const created = await createShift(newShift);

        for (const participantId of formData.participant_ids) {
          await addShiftParticipant(created.id, participantId);
        }

        toast.success('Shift created successfully');

        const staffMember = staff.find(s => s.id === staffId);
        if (staffMember?.auth_user_id && formData.house_id) {
          const shiftHouse = houses.find(h => h.id === formData.house_id);
          if (shiftHouse) {
            await NotificationService.notifyShiftAssigned(staffMember.auth_user_id, formData.start_date, shiftHouse.name);
          }
        }
      }

      setShowShiftDialog(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save shift');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      await deleteShift(shiftId);
      toast.success('Shift deleted successfully');
      setShowShiftDialog(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete shift');
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
          shiftTemplateFilter={shiftTemplateFilter}
          onShiftTemplateFilterChange={setShiftTemplateFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          showLeave={showLeave}
          onShowLeaveChange={setShowLeave}
        />

        <ShiftCalendar
          staffId={staffId}
          viewMode={viewMode}
          currentDate={currentDate}
          shifts={filteredShifts}
          loading={shiftsLoading || metaLoading}
          canEdit={canEdit}
          leaveBlocks={showLeave ? (leaveBlocks as any) : []}
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
          onEditLeave={handleEditLeave}
        />

        <LeaveDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          leaveId={selectedLeaveId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
          }}
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
