import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { logActivity } from '@/lib/activity-logger';
import {
  Check, X, Clock, AlertTriangle, Car, Stethoscope, FileText,
  ChevronRight, Search, Filter, RefreshCw, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import {
  Toolbar, ToolbarHeading, ToolbarPageTitle, ToolbarDescription,
} from '@/partials/common/toolbar';

interface Timesheet {
  id: string;
  staff_id: string;
  shift_id: string | null;
  clock_in: string;
  clock_out: string;
  actual_start: string | null;
  actual_end: string | null;
  break_minutes: number;
  shift_notes_text: string | null;
  notes: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  incident_tag: boolean;
  sick_shift: boolean;
  overtime_hours: number;
  travel_km: number;
  overtime_explanation: string | null;
  created_at: string;
  staff: { id: string; name: string; auth_user_id: string | null } | null;
  shift: {
    shift_date: string;
    end_date: string | null;
    start_time: string;
    end_time: string;
    shift_type: string;
    house: { name: string } | null;
  } | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive' | 'warning'> = {
  draft: 'warning', pending: 'secondary', approved: 'success', rejected: 'destructive',
};

function calcHours(ts: Timesheet) {
  const s = ts.actual_start || ts.clock_in;
  const e = ts.actual_end   || ts.clock_out;
  const mins = (new Date(e).getTime() - new Date(s).getTime()) / 60000 - (ts.break_minutes || 0);
  return Math.max(0, mins / 60);
}

function ExceptionIcons({ ts }: { ts: Timesheet }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {ts.incident_tag && (
        <span title="Incident flagged" className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 text-xs font-medium">
          <AlertTriangle className="size-3" /> Incident
        </span>
      )}
      {ts.sick_shift && (
        <span title="Sick shift" className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">
          <Stethoscope className="size-3" /> Sick
        </span>
      )}
      {ts.overtime_hours > 0 && (
        <span title={`${Number(ts.overtime_hours).toFixed(1)} hrs overtime`} className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 text-xs font-medium">
          <Clock className="size-3" /> +{Number(ts.overtime_hours).toFixed(1)}h OT
        </span>
      )}
      {ts.travel_km > 0 && (
        <span title={`${ts.travel_km} km travel`} className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
          <Car className="size-3" /> {ts.travel_km} km
        </span>
      )}
      {!ts.shift_notes_text && (
        <span title="No shift notes" className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
          <FileText className="size-3" /> No notes
        </span>
      )}
    </div>
  );
}
export function AdminTimesheetsPage() {
  const { user } = useAuth();
  const [timesheets, setTimesheets]           = useState<Timesheet[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [statusFilter, setStatusFilter]       = useState<StatusFilter>('pending');
  const [search, setSearch]                   = useState('');
  const [selected, setSelected]               = useState<Timesheet | null>(null);
  const [action, setAction]                   = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes]           = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving]                   = useState(false);
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('timesheets')
      .select(`
        id, staff_id, shift_id, clock_in, clock_out, actual_start, actual_end,
        break_minutes, shift_notes_text, notes, status, admin_notes, rejection_reason,
        submitted_at, incident_tag, sick_shift, overtime_hours, travel_km,
        overtime_explanation, created_at,
        staff:staff(id, name, auth_user_id),
        shift:staff_shifts(shift_date, end_date, start_time, end_time, shift_type, house:houses(name))
      `)
      .order('submitted_at', { ascending: false, nullsFirst: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    } else {
      query = query.in('status', ['pending', 'approved', 'rejected']);
    }

    const { data, error } = await query;
    if (error) toast.error('Failed to load timesheets');
    else setTimesheets((data as Timesheet[]) || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const filtered = timesheets.filter((ts) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ts.staff?.name?.toLowerCase().includes(q) ||
      ts.shift?.house?.name?.toLowerCase().includes(q) ||
      ts.shift?.shift_date?.includes(q)
    );
  });

  const pendingCount   = timesheets.filter(t => t.status === 'pending').length;
  const exceptionCount = timesheets.filter(t =>
    t.status === 'pending' && (t.incident_tag || t.sick_shift || t.overtime_hours > 0)
  ).length;

  const openReview = (ts: Timesheet, act: 'approve' | 'reject') => {
    setSelected(ts); setAction(act); setAdminNotes(''); setRejectionReason('');
  };
    const handleAction = async () => {
    if (!selected || !action || !user) return;
    setSaving(true);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: newStatus, admin_notes: adminNotes || null, updated_at: now,
    };
    if (action === 'approve') {
      updatePayload.approved_at = now;
      updatePayload.approved_by = user.staff_id ?? null;
    }
    if (action === 'reject') updatePayload.rejection_reason = rejectionReason || null;

    const { error } = await supabase.from('timesheets').update(updatePayload).eq('id', selected.id);
    if (error) { toast.error('Failed to update timesheet'); setSaving(false); return; }

    const userName = user.fullname || user.email || 'Admin';
    const shiftDate = selected.shift?.shift_date
      ? format(parseISO(selected.shift.shift_date), 'dd MMM yyyy')
      : format(new Date(selected.clock_in), 'dd MMM yyyy');

    await logActivity({
      activityType:      action === 'approve' ? 'approve' : 'reject',
      entityType:        'timesheet',
      entityId:          selected.id,
      entityName:        `Timesheet – ${shiftDate} (${selected.staff?.name ?? 'Unknown'})`,
      userName,
      customDescription: `${action === 'approve' ? 'Approved' : 'Rejected'} timesheet for ${selected.staff?.name ?? 'staff'} on ${shiftDate}${action === 'reject' && rejectionReason ? `: ${rejectionReason}` : ''}`,
    });

    if (selected.staff?.auth_user_id) {
      await supabase.from('notifications').insert({
        user_id: selected.staff.auth_user_id,
        type:    `timesheet_${newStatus}`,
        title:   `Timesheet ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
        body:    action === 'reject' && rejectionReason
          ? `Your timesheet for ${shiftDate} was rejected: ${rejectionReason}`
          : `Your timesheet for ${shiftDate} has been ${newStatus}.`,
        link: '/staff/timesheets',
      });
    }

    toast.success(`Timesheet ${newStatus}`);
    setSelected(null); setAction(null); setSelectedIds(new Set());
    fetchTimesheets(); setSaving(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectableRows = filtered.filter(
    t => t.status === 'pending' && !t.incident_tag && !t.sick_shift && t.overtime_hours === 0
  );

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('timesheets')
      .update({ status: 'approved', approved_at: now, approved_by: user?.staff_id ?? null, updated_at: now })
      .in('id', ids);

    if (error) { toast.error('Bulk approve failed'); setSaving(false); return; }

    const userName = user?.fullname || user?.email || 'Admin';
    for (const id of ids) {
      const ts = timesheets.find(t => t.id === id);
      if (!ts) continue;
      const shiftDate = ts.shift?.shift_date
        ? format(parseISO(ts.shift.shift_date), 'dd MMM yyyy')
        : format(new Date(ts.clock_in), 'dd MMM yyyy');
      await logActivity({
        activityType:      'approve',
        entityType:        'timesheet',
        entityId:          id,
        entityName:        `Timesheet – ${shiftDate} (${ts.staff?.name ?? 'Unknown'})`,
        userName,
        customDescription: `Bulk approved timesheet for ${ts.staff?.name ?? 'staff'} on ${shiftDate}`,
      });
      if (ts.staff?.auth_user_id) {
        await supabase.from('notifications').insert({
          user_id: ts.staff.auth_user_id,
          type: 'timesheet_approved',
          title: 'Timesheet Approved',
          body: `Your timesheet for ${shiftDate} has been approved.`,
          link: '/staff/timesheets',
        });
      }
    }

    toast.success(`${ids.length} timesheet${ids.length !== 1 ? 's' : ''} approved`);
    setSelectedIds(new Set()); fetchTimesheets(); setSaving(false);
  };
    return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Timesheets" />
            <ToolbarDescription>Review and approve staff timesheets</ToolbarDescription>
          </ToolbarHeading>
          <Button variant="outline" size="sm" onClick={fetchTimesheets} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Review</p>
              <p className="text-3xl font-bold mt-1">{pendingCount}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">With Exceptions</p>
              <p className="text-3xl font-bold mt-1 text-orange-600">{exceptionCount}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Approved Today</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {timesheets.filter(t =>
                  t.status === 'approved' &&
                  (t.submitted_at || t.created_at)?.startsWith(new Date().toISOString().slice(0, 10))
                ).length}
              </p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Loaded</p>
              <p className="text-3xl font-bold mt-1">{timesheets.length}</p>
            </CardContent></Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search staff or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All Submitted</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.size > 0 && (
              <Button size="sm" onClick={handleBulkApprove} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="size-4 mr-1.5" />
                Approve {selectedIds.size} selected
              </Button>
            )}
          </div>

          {statusFilter === 'pending' && selectableRows.length > 0 && (
            <p className="text-xs text-muted-foreground -mt-2">
              Timesheets with exceptions (incident, sick, overtime) must be reviewed individually and cannot be bulk approved.
            </p>
          )}

          {/* Table */}
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading timesheets...</CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No timesheets found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search ? 'Try adjusting your search.' : 'No timesheets match the selected filter.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="py-4 px-5 border-b">
                <span className="text-sm text-muted-foreground">
                  {filtered.length} timesheet{filtered.length !== 1 ? 's' : ''}
                  {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
                </span>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {statusFilter === 'pending' && (
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedIds.size === selectableRows.length && selectableRows.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(new Set(selectableRows.map(r => r.id)));
                              else setSelectedIds(new Set());
                            }}
                          />
                        </th>
                      )}
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Location</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Hours</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Exceptions</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((ts) => {
                      const shiftDate = ts.shift?.shift_date
                        ? format(parseISO(ts.shift.shift_date), 'dd MMM yyyy') +
                          (ts.shift.end_date && ts.shift.end_date !== ts.shift.shift_date
                            ? ` – ${format(parseISO(ts.shift.end_date), 'dd MMM yyyy')}`
                            : '')
                        : format(new Date(ts.clock_in), 'dd MMM yyyy');
                      const hrs = calcHours(ts).toFixed(1);
                      const hasException = ts.incident_tag || ts.sick_shift || ts.overtime_hours > 0;
                      const canSelect = ts.status === 'pending' && !hasException;
                      return (
                        <tr
                          key={ts.id}
                          className={`hover:bg-muted/30 transition-colors ${hasException && ts.status === 'pending' ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}`}
                        >
                          {statusFilter === 'pending' && (
                            <td className="px-4 py-3.5">
                              {canSelect ? (
                                <input type="checkbox" className="rounded" checked={selectedIds.has(ts.id)} onChange={() => toggleSelect(ts.id)} />
                              ) : (
                                <span title="Cannot bulk approve — has exceptions" className="text-muted-foreground/40 text-xs">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3.5 font-medium">{ts.staff?.name ?? 'Unknown'}</td>
                          <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">{shiftDate}</td>
                          <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{ts.shift?.house?.name ?? '—'}</td>
                          <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">{hrs} hrs</td>
                          <td className="px-4 py-3.5"><ExceptionIcons ts={ts} /></td>
                          <td className="px-4 py-3.5">
                            <Badge variant={statusVariant[ts.status] ?? 'secondary'} appearance="light">{ts.status}</Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {ts.status === 'pending' ? (
                              <div className="flex items-center gap-1.5 justify-end">
                                <Button size="sm" className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => openReview(ts, 'approve')}>
                                  <Check className="size-3.5 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="h-7 px-2.5 text-xs" onClick={() => openReview(ts, 'reject')}>
                                  <X className="size-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs" onClick={() => { setSelected(ts); setAction(null); }}>
                                View <ChevronRight className="size-3.5 ml-1" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </Container>
            {/* Review / Detail slide-out */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setAction(null); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle>
                  {action === 'approve' ? 'Approve Timesheet' : action === 'reject' ? 'Reject Timesheet' : 'Timesheet Details'}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusVariant[selected.status] ?? 'secondary'} appearance="light">{selected.status}</Badge>
                  {selected.submitted_at && (
                    <span className="text-xs text-muted-foreground">
                      Submitted {format(new Date(selected.submitted_at), 'dd MMM yyyy HH:mm')}
                    </span>
                  )}
                </div>
              </SheetHeader>

              <div className="py-5 space-y-5">
                {/* Staff & shift info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Staff</p>
                    <p className="font-medium">{selected.staff?.name ?? 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                    <p className="font-medium">
                      {selected.shift?.shift_date
                        ? format(parseISO(selected.shift.shift_date), 'EEE dd MMM yyyy') +
                          (selected.shift.end_date && selected.shift.end_date !== selected.shift.shift_date
                            ? ` – ${format(parseISO(selected.shift.end_date), 'dd MMM yyyy')}`
                            : '')
                        : format(new Date(selected.clock_in), 'EEE dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                    <p className="font-medium">{selected.shift?.house?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Shift Type</p>
                    <p className="font-medium capitalize">{selected.shift?.shift_type ?? '—'}</p>
                  </div>
                </div>

                {/* Hours breakdown */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rostered</span>
                    <span>{selected.shift?.start_time?.slice(0, 5) ?? '—'} – {selected.shift?.end_time?.slice(0, 5) ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual</span>
                    <span>
                      {selected.actual_start ? format(new Date(selected.actual_start), 'HH:mm') : format(new Date(selected.clock_in), 'HH:mm')}
                      {' – '}
                      {selected.actual_end ? format(new Date(selected.actual_end), 'HH:mm') : format(new Date(selected.clock_out), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Break</span>
                    <span>{selected.break_minutes} min</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Worked</span>
                    <span>{calcHours(selected).toFixed(1)} hrs</span>
                  </div>
                  {selected.overtime_hours > 0 && (
                    <div className="flex justify-between text-purple-700 dark:text-purple-400">
                      <span>Overtime</span>
                      <span>+{Number(selected.overtime_hours).toFixed(1)} hrs</span>
                    </div>
                  )}
                  {selected.travel_km > 0 && (
                    <div className="flex justify-between text-green-700 dark:text-green-400">
                      <span>Travel</span>
                      <span>{selected.travel_km} km</span>
                    </div>
                  )}
                </div>

                {/* Exception badges */}
                <ExceptionIcons ts={selected} />

                {/* Overtime explanation */}
                {selected.overtime_hours > 0 && selected.overtime_explanation && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overtime Explanation</p>
                    <p className="text-sm border rounded-lg p-3 bg-muted/30">{selected.overtime_explanation}</p>
                  </div>
                )}

                {/* Sick reason */}
                {selected.sick_shift && selected.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Sick Leave Reason</p>
                    <p className="text-sm border rounded-lg p-3 bg-muted/30">{selected.notes}</p>
                  </div>
                )}

                {/* Shift notes */}
                {selected.shift_notes_text && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Shift Notes</p>
                    <p className="text-sm border rounded-lg p-3 bg-muted/30 whitespace-pre-wrap">{selected.shift_notes_text}</p>
                  </div>
                )}

                {/* Previous rejection reason (view mode) */}
                {selected.status === 'rejected' && selected.rejection_reason && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                    <p className="text-xs font-medium text-destructive mb-1">Rejection Reason</p>
                    <p className="text-sm text-destructive/80">{selected.rejection_reason}</p>
                  </div>
                )}
                {/* Action fields — approve or reject */}
                {action && (
                  <div className="space-y-3 border-t pt-4">
                    {action === 'reject' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="rejectionReason">
                          Rejection Reason <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this timesheet is being rejected..."
                          rows={3}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
                      <Textarea
                        id="adminNotes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Any additional notes for the staff member..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="border-t pt-4 gap-2">
                {action ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => { setSelected(null); setAction(null); }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={action === 'approve' ? 'default' : 'destructive'}
                      onClick={handleAction}
                      disabled={saving || (action === 'reject' && !rejectionReason.trim())}
                      className={action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                    >
                      {saving
                        ? 'Saving...'
                        : action === 'approve'
                        ? 'Confirm Approve'
                        : 'Confirm Reject'}
                    </Button>
                  </>
                ) : selected.status === 'pending' ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setAction('reject')}
                    >
                      <X className="size-4 mr-1.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setAction('approve')}
                    >
                      <Check className="size-4 mr-1.5" /> Approve
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => { setSelected(null); setAction(null); }}
                  >
                    Close
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}