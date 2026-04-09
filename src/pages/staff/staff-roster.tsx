import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

import { cn } from '@/lib/utils';
import { useStaffRoster, RosterEntry as Entry } from '@/hooks/use-staff-roster';

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
  const [shiftTemplateFilter, setShiftTemplateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // List state
  const { data: entries = [], isLoading: loading } = useStaffRoster(user?.staff_id);

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

  const isPast = (entry: Entry) =>
    entry.start_date <= new Date().toISOString().split('T')[0];

  return (
    <>
      <Container>
        <Toolbar className="hidden sm:flex">
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

      <Container className="py-6 sm:py-0">
        {tab === 'calendar' ? (
          user?.staff_id ? (
            <div className="grid gap-5 lg:gap-7.5">
              <Card className="border-0 sm:border">
                <CardContent className="p-4 lg:p-6">
                  <RosterCalendarHeader
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onNavigate={navigatePeriod}
                    getPeriodLabel={getPeriodLabel}
                    showStaffFilter={false}
                    showParticipantFilter={false}
                    houseFilter={houseFilter}
                    onHouseFilterChange={setHouseFilter}
                    houseList={[]}
                    shiftTemplateFilter={shiftTemplateFilter}
                    onShiftTemplateFilterChange={setShiftTemplateFilter}
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
                shiftTemplateFilter={shiftTemplateFilter}
                statusFilter={statusFilter}
                canEdit={false}
                includeEvents={true}
                checklists={[]}
              />
            </div>
          ) : (
            <Card className="border-0 sm:border">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No staff profile linked to your account.
              </CardContent>
            </Card>
          )
        ) : (
          <div className="grid gap-5 lg:gap-7.5">
            {loading ? (
              <Card className="border-0 sm:border">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Loading shifts...
                </CardContent>
              </Card>
            ) : entries.length === 0 ? (
              <Card className="border-0 sm:border">
                <CardContent className="py-16 flex flex-col items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <Calendar className="size-7 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No commitments found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your scheduled shifts and assigned events will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 sm:border">
                <CardHeader className="py-4 px-5">
                  <span className="text-sm text-muted-foreground">
                    {entries.length} item{entries.length !== 1 ? 's' : ''}
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
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Details</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 font-medium">
                            {format(parseISO(entry.start_date), 'EEE dd MMM yyyy')}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                            {entry.start_time?.slice(0, 5)} – {entry.end_time?.slice(0, 5)}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                            {entry.house?.name ?? entry.location ?? '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            {entry.entry_type === 'shift' ? (
                              <Badge variant="secondary" appearance="light">
                                Shift
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className={cn("font-bold", 
                                  entry.type_color === 'red' ? 'text-red-600 bg-red-50 border-red-200' :
                                  entry.type_color === 'green' ? 'text-green-600 bg-green-50 border-green-200' :
                                  entry.type_color === 'purple' ? 'text-purple-600 bg-purple-50 border-purple-200' :
                                  'text-blue-600 bg-blue-50 border-blue-200'
                                )}
                              >
                                {entry.type_name || 'Event'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {entry.entry_type === 'shift' ? (
                              <span className="text-muted-foreground">{entry.shift_template || 'Standard'}</span>
                            ) : (
                              <span className="font-semibold text-gray-800">{entry.title}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {entry.entry_type === 'shift' ? (
                              entry.has_timesheet ? (
                                <Badge variant="success" appearance="light">Submitted</Badge>
                              ) : isPast(entry) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/staff/roster/${entry.id}/timesheet`)}
                                >
                                  <ClipboardList className="size-3.5 me-1.5" />
                                  Timesheet
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Upcoming</span>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
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
