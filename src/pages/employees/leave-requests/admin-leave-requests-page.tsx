import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { format, isToday, parseISO } from 'date-fns';
import { Check, X, AlertTriangle, Paperclip, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTable } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';

interface LeaveRequest {
  id: string;
  staff_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  attachment_url: string | null;
  created_at: string;
  staff: { id: string; name: string; auth_user_id: string | null } | null;
  leave_type: { name: string } | null;
  conflict_count?: number;
}

interface AffectedShift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  house: { name: string } | null;
}

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function AdminLeaveRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [affectedShifts, setAffectedShifts] = useState<AffectedShift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [conflictCounts, setConflictCounts] = useState<Record<string, number>>({});

  const dayCount = (req: LeaveRequest) => {
    const ms = new Date(req.end_date).getTime() - new Date(req.start_date).getTime();
    return Math.round(ms / 86400000) + 1;
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, staff:staff(id, name, auth_user_id), leave_type:leave_types(name)')
      .order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load leave requests'); setLoading(false); return; }
    const rows = (data as LeaveRequest[]) || [];
    setRequests(rows);

    // Fetch conflict counts for all pending requests
    const pending = rows.filter(r => r.status === 'pending');
    if (pending.length > 0) {
      const counts: Record<string, number> = {};
      await Promise.all(pending.map(async (req) => {
        const { count } = await supabase
          .from('staff_shifts')
          .select('id', { count: 'exact', head: true })
          .eq('staff_id', req.staff_id)
          .gte('shift_date', req.start_date)
          .lte('shift_date', req.end_date)
          .not('status', 'eq', 'Cancelled');
        counts[req.id] = count ?? 0;
      }));
      setConflictCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openAction = async (req: LeaveRequest, act: 'approve' | 'reject') => {
    setSelected(req);
    setAction(act);
    setAdminNotes('');
    setAffectedShifts([]);
    setLoadingShifts(true);
    const { data } = await supabase
      .from('staff_shifts')
      .select('id, shift_date, start_time, end_time, status, house:houses(name)')
      .eq('staff_id', req.staff_id)
      .gte('shift_date', req.start_date)
      .lte('shift_date', req.end_date)
      .not('status', 'eq', 'Cancelled')
      .order('shift_date');
    setAffectedShifts((data as AffectedShift[]) || []);
    setLoadingShifts(false);
  };

  const isSelf = selected?.staff_id === user?.staff_id;

  const handleSubmit = async () => {
    if (!selected || !action) return;
    if (isSelf && action === 'approve') {
      toast.error('You cannot approve your own leave request');
      return;
    }
    setSaving(true);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error } = await supabase
      .from('leave_requests')
      .update({ status: newStatus, admin_notes: adminNotes || null, updated_at: new Date().toISOString() })
      .eq('id', selected.id);

    if (error) {
      toast.error('Failed to update leave request');
      setSaving(false);
      return;
    }

    // On approval: mark conflicting shifts as 'Leave Cover Required'
    if (action === 'approve' && affectedShifts.length > 0) {
      const shiftIds = affectedShifts.map(s => s.id);
      await supabase
        .from('staff_shifts')
        .update({ status: 'Leave Cover Required' })
        .in('id', shiftIds);
    }

    toast.success(`Leave request ${newStatus}`);

    if (selected.staff?.auth_user_id) {
      await supabase.from('notifications').insert({
        user_id: selected.staff.auth_user_id,
        type: `leave_${newStatus}`,
        title: `Leave Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        body: adminNotes || `Your ${selected.leave_type?.name ?? 'leave'} request (${format(new Date(selected.start_date), 'dd MMM')} – ${format(new Date(selected.end_date), 'dd MMM yyyy')}) has been ${newStatus}.`,
        link: '/staff/leave',
      });
    }

    setSelected(null);
    setAction(null);
    fetchRequests();
    setSaving(false);
  };

  // Same-day sick leave alert: flag pending sick leave where start_date is today
  const sameDaySickLeave = requests.filter(
    r => r.status === 'pending' &&
      r.leave_type?.name?.toLowerCase().includes('sick') &&
      isToday(parseISO(r.start_date))
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Leave Requests" />
            <ToolbarDescription>Review and action staff leave requests</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">

          {/* Same-day sick leave alert banner */}
          {sameDaySickLeave.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex gap-3">
              <AlertTriangle className="size-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {sameDaySickLeave.length} same-day sick leave{sameDaySickLeave.length !== 1 ? 's' : ''} require urgent attention
                </p>
                <div className="mt-1 space-y-0.5">
                  {sameDaySickLeave.map(r => (
                    <p key={r.id} className="text-sm">
                      <span className="font-medium">{r.staff?.name}</span> — {r.leave_type?.name}
                      {conflictCounts[r.id] ? ` · ${conflictCounts[r.id]} shift${conflictCounts[r.id] !== 1 ? 's' : ''} affected` : ''}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading...</CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                No leave requests submitted yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardTable>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Staff</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Dates</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Duration</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Conflicts</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {requests.map((req) => {
                      const isSelfRow = req.staff_id === user?.staff_id;
                      return (
                        <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 font-medium">
                            {req.staff?.name ?? 'Unknown'}
                            {isSelfRow && (
                              <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">{req.leave_type?.name ?? 'Leave'}</td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                            {format(new Date(req.start_date), 'dd MMM yyyy')}
                            {req.start_date !== req.end_date && (
                              <> – {format(new Date(req.end_date), 'dd MMM yyyy')}</>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                            {dayCount(req)} day{dayCount(req) !== 1 ? 's' : ''}
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            {req.status === 'pending' && conflictCounts[req.id] != null ? (
                              conflictCounts[req.id] > 0 ? (
                                <Badge variant="warning" appearance="light">
                                  {conflictCounts[req.id]} shift{conflictCounts[req.id] !== 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/50 text-xs">None</span>
                              )
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={statusVariant[req.status] ?? 'secondary'} appearance="light">
                              {statusLabel[req.status] ?? req.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-xs">
                            {format(new Date(req.created_at), 'dd MMM yyyy')}
                          </td>
                          <td className="px-5 py-3.5">
                            {req.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() => openAction(req, 'approve')}
                                  disabled={isSelfRow}
                                  title={isSelfRow ? 'Cannot approve your own leave' : 'Approve'}
                                >
                                  <Check className="size-3.5 me-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() => openAction(req, 'reject')}
                                >
                                  <X className="size-3.5 me-1" /> Reject
                                </Button>
                              </div>
                            )}
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

      {/* Approve / Reject dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setAction(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            {selected && (
              <DialogDescription>
                {selected.staff?.name} · {selected.leave_type?.name} ·{' '}
                {format(new Date(selected.start_date), 'dd MMM')} – {format(new Date(selected.end_date), 'dd MMM yyyy')}
                {' '}({dayCount(selected)} day{dayCount(selected) !== 1 ? 's' : ''})
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Self-approval warning */}
            {isSelf && action === 'approve' && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex gap-2">
                <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  You cannot approve your own leave. Another supervisor must action this.
                </p>
              </div>
            )}

            {/* Reason / attachment */}
            {selected?.reason && (
              <div className="text-sm">
                <span className="font-medium">Reason: </span>
                <span className="text-muted-foreground">{selected.reason}</span>
              </div>
            )}
            {selected?.attachment_url && (
              <a
                href={selected.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary underline"
              >
                <Paperclip className="size-3.5" /> View attachment
              </a>
            )}

            {/* Affected shifts */}
            {action === 'approve' && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  Affected shifts
                  {loadingShifts && <span className="text-xs text-muted-foreground ml-1">(loading...)</span>}
                </p>
                {!loadingShifts && affectedShifts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No active shifts during this period.</p>
                )}
                {affectedShifts.length > 0 && (
                  <>
                    <div className="rounded-md border divide-y max-h-40 overflow-y-auto">
                      {affectedShifts.map(s => (
                        <div key={s.id} className="px-3 py-2 text-sm flex items-center justify-between">
                          <span>{format(parseISO(s.shift_date), 'EEE dd MMM')}</span>
                          <span className="text-muted-foreground">
                            {s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)}
                            {s.house?.name ? ` · ${s.house.name}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These shifts will be marked as <strong>Leave Cover Required</strong> on approval.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Admin notes */}
            <div className="space-y-1.5">
              <Label>Admin Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add a note for the staff member..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); }} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleSubmit}
              disabled={saving || (isSelf && action === 'approve')}
            >
              {saving ? 'Saving...' : action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
