import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import { Calendar, Umbrella, ClipboardList, ChevronRight, PlayCircle, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { WelcomeBanner } from '../dashboards/home/components';
import { useStaffDashboardData } from '@/hooks/use-staff-dashboard-data';
import { cn, getPeriodTheme } from '@/lib/utils';

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useStaffDashboardData(user?.staff_id);

  const upcomingSchedule = data?.upcomingSchedule || [];
  const pendingLeave = data?.pendingLeave || [];
  const pendingTimesheets = data?.pendingTimesheets || [];
  const missingTimesheetsCount = data?.missingTimesheetsCount || 0;

  // Identify if currently on shift
  const now = new Date();
  const nowTime = format(now, 'HH:mm:ss');
  const todayStr = format(now, 'yyyy-MM-dd');
  
  const currentShift = upcomingSchedule.find((item: any) => 
    item.entry_type === 'shift' &&
    item.start_date === todayStr && 
    nowTime >= item.start_time && 
    nowTime <= item.end_time
  );

  return (
    <>
      <Container className="mb-6 mt-4">
        <WelcomeBanner />
      </Container>

      <Container>
        <div className="grid gap-4 sm:gap-5 lg:gap-7.5 lg:grid-cols-2">
          {/* Missing Timesheets Alert */}
          {missingTimesheetsCount > 0 && (
            <Card className="lg:col-span-2 border-orange-200 bg-orange-50/10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <AlertCircle className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-orange-900">Timesheets Required</h3>
                      <p className="text-xs text-orange-700 mt-0.5">
                        You have {missingTimesheetsCount} completed shift{missingTimesheetsCount !== 1 ? 's' : ''} missing a timesheet.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs"
                    onClick={() => navigate('/staff/timesheets')}
                  >
                    CREATE NOW <ChevronRight className="size-3.5 ms-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Shift / Clock In Suggestion */}
          {currentShift && (
            <Card className={cn(
              "lg:col-span-2 border-primary/20 bg-primary/5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500",
              !currentShift.checklist_stats?.all_done && currentShift.checklist_stats?.total > 0 && "border-orange-200 bg-orange-50/10"
            )}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "size-12 rounded-full flex items-center justify-center animate-pulse",
                      currentShift.checklist_stats?.all_done ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                    )}>
                      {currentShift.checklist_stats?.all_done ? <CheckCircle2 className="size-6" /> : <PlayCircle className="size-6" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Active Shift: {currentShift.house?.house_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Started at {currentShift.start_time.slice(0, 5)} · Scheduled until {currentShift.end_time.slice(0, 5)}
                      </p>
                      
                      {currentShift.checklist_stats?.total > 0 && (
                        <div className="mt-3 max-w-md" data-testid="shift-checklist-progress">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              Shift Routines: {currentShift.checklist_stats.completed} / {currentShift.checklist_stats.total}
                              {!currentShift.checklist_stats.all_done && <AlertTriangle className="size-3 text-orange-500" />}
                            </span>
                            <span className="text-xs font-bold text-primary">
                              {Math.round((currentShift.checklist_stats.completed / currentShift.checklist_stats.total) * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                currentShift.checklist_stats.all_done ? "bg-green-500" : "bg-primary"
                              )} 
                              style={{ width: `${(currentShift.checklist_stats.completed / currentShift.checklist_stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                      className={cn(
                        "flex-1 md:flex-none font-bold shadow-lg shadow-primary/20",
                        currentShift.checklist_stats?.all_done ? "bg-green-600 hover:bg-green-700" : "bg-primary"
                      )} 
                      onClick={() => navigate('/staff/checklists')}
                    >
                      <ClipboardList className="size-4 me-2" />
                      {currentShift.checklist_stats?.all_done ? 'Review Checklists' : 'Complete Checklists'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Schedule */}
          <Card className="border-0 sm:border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4" /> Upcoming Schedule
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
              ) : upcomingSchedule.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming commitments.</p>
              ) : (
                <div className="divide-y">
                  {upcomingSchedule.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{format(new Date(item.start_date), 'EEE dd MMM')}</p>
                          {(() => {
                            const theme = getPeriodTheme(item.type_name, item.type_color);
                            const Icon = theme.icon;
                            return (
                              <Badge variant="outline" className={cn("text-[9px] font-bold h-4 px-1 gap-1", theme.badge)}>
                                <Icon className={cn("size-2", theme.text)} />
                                {item.type_name}
                              </Badge>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}
                            {item.house ? ` · ${item.house.house_name}` : ''}
                            {item.entry_type === 'event' && item.location ? ` · ${item.location}` : ''}
                          </p>
                        </div>
                        {item.entry_type === 'event' && (
                          <p className="text-sm font-semibold text-gray-800 mt-1">{item.title}</p>
                        )}
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
                        <p className="text-sm font-medium">{req.leave_type?.leave_type_name ?? 'Leave'}</p>
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
                {(pendingTimesheets.length > 0 || missingTimesheetsCount > 0) && (
                  <Badge variant="warning" appearance="light" className="ml-1 text-[10px]">
                    {(() => {
                      const drafts = missingTimesheetsCount;
                      const pending = pendingTimesheets.filter((t: any) => t.status === 'pending').length;
                      
                      if (drafts > 0 && pending > 0) return `${drafts} action, ${pending} pending`;
                      if (drafts > 0) return `${drafts} action required`;
                      return `${pending} awaiting approval`;
                    })()}
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
                          {ts.shift?.start_date
                            ? format(new Date(ts.shift.start_date), 'EEE dd MMM yyyy')
                            : format(new Date(ts.clock_in), 'EEE dd MMM yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{ts.status}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" appearance="light">
                          {ts.status}
                        </Badge>
                      </div>
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
                  <ClipboardList className="size-4 me-1.5" /> My Checklists
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
