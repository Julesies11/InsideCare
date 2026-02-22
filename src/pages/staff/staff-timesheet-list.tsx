import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO } from 'date-fns';
import {
  Clock,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTable } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';

interface Timesheet {
  id: string;
  shift_id: string | null;
  clock_in: string;
  clock_out: string;
  actual_start: string | null;
  actual_end: string | null;
  break_minutes: number;
  shift_notes_text: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  incident_tag: boolean;
  sick_shift: boolean;
  overtime_hours: number;
  travel_km: number;
  created_at: string;
  shift: {
    shift_date: string;
    start_time: string;
    end_time: string;
    shift_type: string;
    house: { name: string } | null;
  } | null;
}

type TabKey = 'draft' | 'pending' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'draft',    label: 'Needs Submission',  icon: AlertCircle  },
  { key: 'pending',  label: 'Awaiting Approval', icon: Clock        },
  { key: 'approved', label: 'Approved',          icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected',          icon: XCircle      },
];

const statusVariant: Record<TabKey, 'warning' | 'secondary' | 'success' | 'destructive'> = {
  draft:    'warning',
  pending:  'secondary',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabel: Record<TabKey, string> = {
  draft:    'Needs Submission',
  pending:  'Awaiting Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function calcHours(ts: Timesheet) {
  const s = ts.actual_start || ts.clock_in;
  const e = ts.actual_end   || ts.clock_out;
  const mins = (new Date(e).getTime() - new Date(s).getTime()) / 60000 - (ts.break_minutes || 0);
  return Math.max(0, mins / 60);
}

export function StaffTimesheetList() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<TabKey>('draft');

  const fetchTimesheets = useCallback(async () => {
    if (!user?.staff_id) { setLoading(false); return; }
    const { data } = await supabase
      .from('timesheets')
      .select(`
        id, shift_id, clock_in, clock_out, actual_start, actual_end,
        break_minutes, shift_notes_text, status, admin_notes,
        rejection_reason, submitted_at, incident_tag, sick_shift,
        overtime_hours, travel_km, created_at,
        shift:staff_shifts(shift_date, start_time, end_time, shift_type, house:houses(name))
      `)
      .eq('staff_id', user.staff_id)
      .order('created_at', { ascending: false });
    setTimesheets((data as Timesheet[]) || []);
    setLoading(false);
  }, [user?.staff_id]);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const counts = TABS.reduce<Record<TabKey, number>>((acc, t) => {
    acc[t.key] = timesheets.filter(ts => ts.status === t.key).length;
    return acc;
  }, {} as Record<TabKey, number>);

  const visible = timesheets.filter(ts => ts.status === activeTab);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="My Timesheets" />
            <ToolbarDescription>Track and submit your shift timesheets</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">

          {/* Tab bar */}
          <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                  activeTab === key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                {label}
                {counts[key] > 0 && (
                  <span className={`inline-flex items-center justify-center size-5 rounded-full text-xs font-semibold ${
                    activeTab === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Rejection banner */}
          {activeTab === 'rejected' && visible.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex gap-3">
              <AlertTriangle className="size-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {visible.length} timesheet{visible.length !== 1 ? 's' : ''} rejected
                </p>
                <p className="text-sm text-destructive/80 mt-0.5">
                  Review the rejection reasons below and contact your supervisor if needed.
                </p>
              </div>
            </div>
          )}

          {/* Draft reminder banner */}
          {activeTab === 'draft' && visible.length > 0 && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 flex gap-3">
              <AlertCircle className="size-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-warning-foreground">
                  {visible.length} timesheet{visible.length !== 1 ? 's' : ''} awaiting submission
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Please submit your timesheets as soon as possible after each shift.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Loading...
              </CardContent>
            </Card>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No timesheets here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'draft'
                      ? 'All your completed shifts have been submitted.'
                      : `No ${statusLabel[activeTab].toLowerCase()} timesheets.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="py-4 px-5 border-b">
                <span className="text-sm text-muted-foreground">
                  {visible.length} timesheet{visible.length !== 1 ? 's' : ''}
                </span>
              </CardHeader>
              <CardTable>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Location</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Hours</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Flags</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visible.map((ts) => {
                      const dateStr = ts.shift?.shift_date
                        ? format(parseISO(ts.shift.shift_date), 'EEE dd MMM yyyy')
                        : format(new Date(ts.clock_in), 'EEE dd MMM yyyy');
                      const hrs = calcHours(ts).toFixed(1);
                      return (
                        <tr key={ts.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 font-medium">{dateStr}</td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                            {ts.shift?.house?.name ?? '—'}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                            {hrs} hrs
                            {ts.overtime_hours > 0 && (
                              <span className="ml-1.5 text-xs text-orange-600 font-medium">
                                +{Number(ts.overtime_hours).toFixed(1)} OT
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {ts.incident_tag && (
                                <span title="Incident tagged" className="text-sm leading-none">📝</span>
                              )}
                              {ts.sick_shift && (
                                <span title="Sick shift" className="text-sm leading-none">💊</span>
                              )}
                              {ts.overtime_hours > 0 && (
                                <span title="Overtime claimed" className="text-sm leading-none">🟧</span>
                              )}
                              {ts.travel_km > 0 && (
                                <span title="Travel claimed" className="text-sm leading-none">📍</span>
                              )}
                              {!ts.shift_notes_text && (
                                <span title="No shift notes" className="text-sm leading-none">⚠️</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <Badge variant={statusVariant[ts.status]} appearance="light">
                              {statusLabel[ts.status]}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {ts.status === 'draft' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs"
                                onClick={() => navigate(`/staff/roster/${ts.shift_id}/timesheet`)}
                              >
                                Submit <ChevronRight className="size-3.5 ms-1" />
                              </Button>
                            ) : ts.status === 'rejected' && (ts.rejection_reason || ts.admin_notes) ? (
                              <p className="text-xs text-destructive italic max-w-[180px] truncate text-right">
                                {ts.rejection_reason || ts.admin_notes}
                              </p>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardTable>
            </Card>
          )}
        </div>
      </Container>
    </>
  );
}
