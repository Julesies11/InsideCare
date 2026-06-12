import { useState } from 'react';
import { StaffRosterCalendar as RosterCalendarView } from '@/pages/roster-board/components/staff-roster-calendar';
import { addDays, addMonths, addWeeks, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode } from '@/components/roster/roster-utils';

interface StaffRosterProps {
  staffId: string;
  canEdit: boolean;
}

export function StaffRoster({ staffId, canEdit }: StaffRosterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showLeave, setShowLeave] = useState<boolean>(true);
  const [showEvents, setShowEvents] = useState<boolean>(false);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'today') {
      setCurrentDate((prev) => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate((prev) => addMonths(prev, direction === 'next' ? 1 : -1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'today') return format(currentDate, 'MMMM d, yyyy');
    if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(
        currentDate.getDate() - ((currentDate.getDay() + 6) % 7),
      );
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
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
        />
      </CardContent>
    </Card>
  );
}
