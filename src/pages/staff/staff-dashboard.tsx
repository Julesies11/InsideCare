import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import { Calendar, Umbrella, ClipboardList, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
  ToolbarActions,
} from '@/partials/common/toolbar';

interface UpcomingShift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  house: { name: string } | null;
}

interface PendingLeave {
  id: string;
  leave_type: { name: string } | null;
  start_date: string;
  end_date: string;
  status: string;
}

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingShifts, setUpcomingShifts] = useState<UpcomingShift[]>([]);
  const [pendingLeave, setPendingLeave] = useState<PendingLeave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.staff_id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];

      const [shiftsRes, leaveRes] = await Promise.all([
        supabase
          .from('staff_shifts')
          .select('id, shift_date, start_time, end_time, house:houses(name)')
          .eq('staff_id', user.staff_id)
          .gte('shift_date', today)
          .order('shift_date', { ascending: true })
          .limit(3),
        supabase
          .from('leave_requests')
          .select('id, leave_type:leave_types(name), start_date, end_date, status')
          .eq('staff_id', user.staff_id)
          .in('status', ['pending', 'approved'])
          .order('start_date', { ascending: true })
          .limit(3),
      ]);

      setUpcomingShifts((shiftsRes.data as UpcomingShift[]) || []);
      setPendingLeave((leaveRes.data as PendingLeave[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [user?.staff_id]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text={`${greeting()}, ${user?.first_name || 'there'}`} />
            <ToolbarDescription>Here's your overview for today</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={() => navigate('/staff/leave/new')}>
              <Plus className="size-4 me-1.5" />
              Request Leave
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5 lg:grid-cols-2">
          {/* Upcoming Shifts */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4" /> Upcoming Shifts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/roster')}>
                View all <ChevronRight className="size-4 ms-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : upcomingShifts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming shifts.</p>
              ) : (
                <div className="divide-y">
                  {upcomingShifts.map((shift) => (
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
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Umbrella className="size-4" /> Leave Requests
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/staff/leave')}>
                View all <ChevronRight className="size-4 ms-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : pendingLeave.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active leave requests.</p>
              ) : (
                <div className="divide-y">
                  {pendingLeave.map((req) => (
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

          {/* Quick Actions */}
          <Card className="lg:col-span-2">
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
