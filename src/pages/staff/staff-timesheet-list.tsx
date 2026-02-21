import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Timesheet {
  id: string;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive'> = {
  pending: 'secondary',
  approved: 'success',
  rejected: 'destructive',
};

export function StaffTimesheetList() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.staff_id) { setLoading(false); return; }
    const fetchTimesheets = async () => {
      const { data } = await supabase
        .from('timesheets')
        .select('id, clock_in, clock_out, break_minutes, notes, status, admin_notes, created_at')
        .eq('staff_id', user.staff_id)
        .order('created_at', { ascending: false });
      setTimesheets((data as Timesheet[]) || []);
      setLoading(false);
    };
    fetchTimesheets();
  }, [user?.staff_id]);

  const totalHours = (ts: Timesheet) => {
    const ms = new Date(ts.clock_out).getTime() - new Date(ts.clock_in).getTime();
    const mins = ms / 60000 - ts.break_minutes;
    return (mins / 60).toFixed(1);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold pt-2">My Timesheets</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : timesheets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timesheets submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {timesheets.map((ts) => (
            <Card key={ts.id}>
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {format(new Date(ts.clock_in), 'EEE dd MMM yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {format(new Date(ts.clock_in), 'HH:mm')} – {format(new Date(ts.clock_out), 'HH:mm')}
                      {' · '}{totalHours(ts)} hrs
                      {ts.break_minutes > 0 ? ` (${ts.break_minutes}m break)` : ''}
                    </p>
                  </div>
                  <Badge variant={statusVariant[ts.status] ?? 'default'}>
                    {ts.status}
                  </Badge>
                </div>
                {ts.notes && <p className="text-sm">{ts.notes}</p>}
                {ts.admin_notes && (
                  <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
                    Admin: {ts.admin_notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
