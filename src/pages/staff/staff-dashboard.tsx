import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import { Calendar, Umbrella, ClipboardList, ChevronRight, PlayCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { WelcomeBanner } from '../dashboards/home/components';
import { useStaffDashboardData } from '@/hooks/use-staff-dashboard-data';

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useStaffDashboardData(user?.staff_id);

  const upcomingShifts = data?.upcomingShifts || [];
  const pendingLeave = data?.pendingLeave || [];
  const pendingTimesheets = data?.pendingTimesheets || [];

  // Identify if currently on shift
  const now = new Date();
  const nowTime = format(now, 'HH:mm:ss');
  const todayStr = format(now, 'yyyy-MM-dd');
  
  const currentShift = upcomingShifts.find((s: any) => 
    s.shift_date === todayStr && 
    nowTime >= s.start_time && 
    nowTime <= s.end_time
  );

  return (
    <>
      <Container className="mb-6 mt-4">
        <WelcomeBanner />
      </Container>

      <Container>
        <div className="grid gap-4 sm:gap-5 lg:gap-7.5 lg:grid-cols-2">
          {/* Active Shift / Clock In Suggestion */}
          {currentShift && (
            <Card className="lg:col-span-2 border-primary/20 bg-primary/5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <PlayCircle className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Active Shift: {currentShift.house?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Started at {currentShift.start_time.slice(0, 5)} · Scheduled until {currentShift.end_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                      className="flex-1 md:flex-none font-bold shadow-lg shadow-primary/20" 
                      onClick={() => navigate('/staff/checklists')}
                    >
                      <ClipboardList className="size-4 me-2" />
                      Go to Checklists
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Shifts */}
          <Card className="border-0 sm:border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4" /> Upcoming Shifts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/roster')}>
                View all <ChevronRight className="size-4 ms-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                  <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                </div>
              ) : upcomingShifts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming shifts.</p>
              ) : (
                <div className="divide-y">
                  {upcomingShifts.map((shift: any) => (
                    <div key={shift.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium">{format(new Date(shift.shift_date), 'EEE dd MMM')}</p>
                        <p className="text-xs text-muted-foreground">
                          {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                          {shift.house ? ` · ${shift.house.name}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Requests */}
          <Card className="border-0 sm:border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Umbrella className="size-4" /> Leave Requests
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/leave')}>
                View all <ChevronRight className="size-4 ms-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                  <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                </div>
              ) : pendingLeave.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active leave requests.</p>
              ) : (
                <div className="divide-y">
                  {pendingLeave.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium">{req.leave_type?.name ?? 'Leave'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.start_date), 'dd MMM')} – {format(new Date(req.end_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'success' : 'warning'} appearance="light">
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timesheets */}
          <Card className="lg:col-span-2 border-0 sm:border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="size-4" /> Timesheets
                {pendingTimesheets.length > 0 && (
                  <Badge variant="warning" appearance="light" className="ml-1">
                    {pendingTimesheets.filter((t: any) => t.status === 'draft').length > 0
                      ? `${pendingTimesheets.filter((t: any) => t.status === 'draft').length} draft${pendingTimesheets.filter((t: any) => t.status === 'draft').length !== 1 ? 's' : ''}`
                      : `${pendingTimesheets.length} pending`}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/timesheets')}>
                View all <ChevronRight className="size-4 ms-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                  <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                </div>
              ) : pendingTimesheets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No timesheets awaiting action.</p>
              ) : (
                <div className="divide-y">
                  {pendingTimesheets.map((ts: any) => (
                    <div key={ts.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium">
                          {ts.shift?.shift_date
                            ? format(new Date(ts.shift.shift_date), 'EEE dd MMM yyyy')
                            : format(new Date(ts.clock_in), 'EEE dd MMM yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{ts.status}</p>
                      </div>
                      <Badge variant={ts.status === 'draft' ? 'warning' : 'secondary'} appearance="light">
                        {ts.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-2 border-0 sm:border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="size-4" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate('/staff/leave/new')}>
                  <Umbrella className="size-4 me-1.5" /> Request Leave
                </Button>
                <Button variant="outline" onClick={() => navigate('/staff/checklists')}>
                  <ClipboardList className="size-4 me-1.5" /> House Checklists
                </Button>
                <Button variant="outline" onClick={() => navigate('/staff/timesheets')}>
                  <ClipboardList className="size-4 me-1.5" /> My Timesheets
                </Button>
                <Button variant="outline" onClick={() => navigate('/staff/roster')}>
                  <Calendar className="size-4 me-1.5" /> View Roster
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
