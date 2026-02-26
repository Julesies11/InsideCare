import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO, addDays, addWeeks, addMonths } from 'date-fns';
import { ClipboardList, Calendar, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTable } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import { StaffRosterCalendar } from '@/pages/roster-board/components/staff-roster-calendar';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode } from '@/components/roster/roster-utils';

interface Shift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
  house: { name: string } | null;
  has_timesheet?: boolean;
}

type TabView = 'calendar' | 'list';

export function StaffRoster() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab
  const [tab, setTab] = useState<TabView>('calendar');

  // Calendar state
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [houseFilter, setHouseFilter] = useState('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // List state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'list') return;
    if (!user?.staff_id) { setLoading(false); return; }

    const fetchShifts = async () => {
      setLoading(true);
      const { data: shiftsData, error } = await supabase
        .from('staff_shifts')
        .select('id, shift_date, start_time, end_time, shift_type, status, house:houses(name)')
        .eq('staff_id', user.staff_id)
        .order('shift_date', { ascending: false });

      if (error || !shiftsData) { setLoading(false); return; }

      const shiftIds = shiftsData.map((s) => s.id);
      const { data: timesheetData } = await supabase
        .from('timesheets')
        .select('shift_id')
        .in('shift_id', shiftIds.length > 0 ? shiftIds : ['00000000-0000-0000-0000-000000000000']);

      const timesheetedIds = new Set((timesheetData || []).map((t) => t.shift_id));
      setShifts(
        shiftsData.map((s) => ({
          ...s,
          house: s.house as { name: string } | null,
          has_timesheet: timesheetedIds.has(s.id),
        }))
      );
      setLoading(false);
    };

    fetchShifts();
  }, [tab, user?.staff_id]);

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
    if (viewMode === 'today') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const isPast = (shift: Shift) =>
    shift.shift_date <= new Date().toISOString().split('T')[0];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="My Roster" />
            <ToolbarDescription>View your scheduled shifts</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-3 gap-1.5 ${
                  tab === 'calendar'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('calendar')}
              >
                <Calendar className="size-3.5" />
                Calendar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-3 gap-1.5 ${
                  tab === 'list'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('list')}
              >
                <List className="size-3.5" />
                List
              </Button>
            </div>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {tab === 'calendar' ? (
          user?.staff_id ? (
            <div className="grid gap-5 lg:gap-7.5">
              <Card>
                <CardContent className="p-4 lg:p-6">
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
                    houseList={[]}
                    shiftTypeFilter={shiftTypeFilter}
                    onShiftTypeFilterChange={setShiftTypeFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                  />
                </CardContent>
              </Card>
              <StaffRosterCalendar
                staffId={user.staff_id}
                viewMode={viewMode}
                currentDate={currentDate}
                houseFilter={houseFilter}
                participantFilter="all"
                shiftTypeFilter={shiftTypeFilter}
                statusFilter={statusFilter}
                canEdit={false}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No staff profile linked to your account.
              </CardContent>
            </Card>
          )
        ) : (
          <div className="grid gap-5 lg:gap-7.5">
            {loading ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Loading shifts...
                </CardContent>
              </Card>
            ) : shifts.length === 0 ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <Calendar className="size-7 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No shifts found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your scheduled shifts will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="py-4 px-5">
                  <span className="text-sm text-muted-foreground">
                    {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
                  </span>
                </CardHeader>
                <CardTable>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Time</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Location</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Timesheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {shifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 font-medium">
                            {format(parseISO(shift.shift_date), 'EEE dd MMM yyyy')}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                            {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                            {shift.house?.name ?? '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="secondary" appearance="light">
                              {shift.shift_type || 'Standard'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={
                                shift.status === 'Completed'
                                  ? 'success'
                                  : shift.status === 'Cancelled'
                                  ? 'destructive'
                                  : 'warning'
                              }
                              appearance="light"
                            >
                              {shift.status || 'Scheduled'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            {shift.has_timesheet ? (
                              <Badge variant="success" appearance="light">Submitted</Badge>
                            ) : isPast(shift) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/staff/roster/${shift.id}/timesheet`)}
                              >
                                <ClipboardList className="size-3.5 me-1.5" />
                                Submit
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Upcoming</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardTable>
              </Card>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
