import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { StaffRosterCalendar as RosterCalendarView } from '@/pages/roster-board/components/staff-roster-calendar';
import { LeaveDialog } from '@/components/roster/leave-dialog';
import { ViewMode } from '@/components/roster/roster-utils';
import { useQueryClient } from '@tanstack/react-query';

interface StaffRosterProps {
  staffId: string;
  canEdit: boolean;
}

export function StaffRoster({ staffId, canEdit }: StaffRosterProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);

  const [showLeave, setShowLeave] = useState<boolean>(true);
  const [showEvents, setShowEvents] = useState<boolean>(false);

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
    if (viewMode === 'today') return format(currentDate, 'MMMM d, yyyy');
    if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const handleEditLeave = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setShowLeaveDialog(true);
  };

  const handleLeaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['staff-roster', staffId] });
    queryClient.invalidateQueries({ queryKey: ['leave-requests', staffId] });
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
          showHouseFilter={false}
          showShiftTemplateFilter={false}
          showLeave={showLeave}
          onShowLeaveChange={setShowLeave}
          showEvents={showEvents}
          onShowEventsChange={setShowEvents}
        />

        <RosterCalendarView
          staffId={staffId}
          viewMode={viewMode}
          currentDate={currentDate}
          houseFilter="all"
          participantFilter="all"
          shiftTemplateFilter="all"
          canEdit={canEdit}
          showLeave={showLeave}
          includeEvents={showEvents}
          isPersonal={true}
          checklists={[]}
          onEditLeave={(leave) => handleEditLeave(leave.id)}
        />

        <LeaveDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          leaveId={selectedLeaveId}
          onSuccess={handleLeaveSuccess}
        />
      </CardContent>
    </Card>
  );
}
