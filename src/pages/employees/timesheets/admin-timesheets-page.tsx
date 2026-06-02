import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  Check, X, ChevronRight, Search, Filter, RefreshCw, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTable, CardFooter } from '@/components/ui/card';
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
import { NotificationService } from '@/lib/notification-service';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { TIMESHEET_STATUS } from '@/config/enums';
import { timesheetsApi } from '@/api/timesheets.api';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

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
  staff: { id: string; staff_name: string; auth_user_id: string | null } | null;
  shift: {
    start_date: string;
    end_date: string | null;
    start_time: string;
    end_time: string;
    shift_template: string;
    house: { house_name: string } | null;
  } | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive' | 'warning'> = {
  [TIMESHEET_STATUS.DRAFT]: 'warning', 
  [TIMESHEET_STATUS.PENDING]: 'secondary', 
  [TIMESHEET_STATUS.APPROVED]: 'success', 
  [TIMESHEET_STATUS.REJECTED]: 'destructive',
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
        <Badge variant="destructive" appearance="light" className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold">
          Incident
        </Badge>
      )}
      {ts.sick_shift && (
        <Badge variant="secondary" appearance="light" className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold bg-purple-100 text-purple-700 border-purple-200">
          Sick
        </Badge>
      )}
      {ts.overtime_hours > 0 && (
        <Badge variant="warning" appearance="light" className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold">
          Overtime
        </Badge>
      )}
      {ts.travel_km > 0 && (
        <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold bg-blue-50 text-blue-700 border-blue-200">
          Travel
        </Badge>
      )}
      {!ts.shift_notes_text && (
        <Badge variant="destructive" appearance="outline" className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold">
          No Notes
        </Badge>
      )}
    </div>
  );
}

export function AdminTimesheetsPage() {
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const queryClient = useQueryClient();
  
  const canEdit = hasAccess({ 
    resource: RBAC_MODULES.TIMESHEETS, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  const [timesheets, setTimesheets]           = useState<Timesheet[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [statusFilter, setStatusFilter]       = useState<StatusFilter>('pending');
  const [search, setSearch]                   = useState('');
  const [selected, setSelected]               = useState<Timesheet | null>(null);
  const [action, setAction]                   = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes]           = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving]                   = useState(false);
  const [rowSelection, setRowSelection]       = useState({});

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await timesheetsApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setTimesheets(data as any[]);
    } catch (error) {
      toast.error('Failed to load timesheets');
    } finally {
      setLoading(false);
      setRowSelection({});
    }
  }, [statusFilter]);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const filtered = useMemo(() => {
    return timesheets.filter((ts) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        ts.staff?.staff_name?.toLowerCase().includes(q) ||
        ts.shift?.house?.house_name?.toLowerCase().includes(q) ||
        ts.shift?.start_date?.includes(q)
      );
    });
  }, [timesheets, search]);

  const pendingCount   = timesheets.filter(t => t.status === TIMESHEET_STATUS.PENDING).length;
  const exceptionCount = timesheets.filter(t =>
    t.status === TIMESHEET_STATUS.PENDING && (t.incident_tag || t.sick_shift || t.overtime_hours > 0)
  ).length;

  const openReview = (ts: Timesheet, act: 'approve' | 'reject') => {
    setSelected(ts); setAction(act); setAdminNotes(''); setRejectionReason('');
  };

  const handleAction = async () => {
    if (!selected || !action || !user) return;
    setSaving(true);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();
    const updatePayload: any = {
      status: newStatus, admin_notes: adminNotes || null,
    };
    if (action === 'approve') {
      updatePayload.approved_at = now;
      updatePayload.approved_by = user.staff_id ?? null;
    }
    if (action === 'reject') updatePayload.rejection_reason = rejectionReason || null;

    try {
      await timesheetsApi.update(selected.id, updatePayload);

      const shiftDate = selected.shift?.start_date
        ? format(parseISO(selected.shift.start_date), 'dd MMM yyyy')
        : format(new Date(selected.clock_in), 'dd MMM yyyy');

      if (selected.staff?.auth_user_id) {
        if (newStatus === TIMESHEET_STATUS.APPROVED) {
          await NotificationService.notifyTimesheetApproved(
            selected.staff.auth_user_id,
            shiftDate
          );
        } else if (newStatus === TIMESHEET_STATUS.REJECTED) {
          await NotificationService.notifyTimesheetRejected(
            selected.staff.auth_user_id,
            shiftDate,
            rejectionReason ? `Your timesheet for ${shiftDate} was rejected: ${rejectionReason}` : undefined
          );
        }
      }

      toast.success(`Timesheet ${newStatus}`);
      setSelected(null); setAction(null); setRowSelection({});
      fetchTimesheets();
    } catch (error) {
      toast.error('Failed to update timesheet');
    } finally {
      setSaving(false);
    }
  };

  const selectedItems = useMemo(() => {
    return filtered.filter((_, _idx) => rowSelection[_idx as keyof typeof rowSelection]);
  }, [filtered, rowSelection]);

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) return;
    setSaving(true);
    const now = new Date().toISOString();
    
    try {
      for (const item of selectedItems) {
        await timesheetsApi.update(item.id, { 
          status: 'approved', 
          approved_at: now, 
          approved_by: user?.staff_id ?? null 
        });

        const shiftDate = item.shift?.start_date
          ? format(parseISO(item.shift.start_date), 'dd MMM yyyy')
          : format(new Date(item.clock_in), 'dd MMM yyyy');

        if (item.staff?.auth_user_id) {
          await NotificationService.notifyTimesheetApproved(
            item.staff.auth_user_id,
            shiftDate
          );
        }
      }

      toast.success(`${selectedItems.length} timesheets approved`);
      setRowSelection({}); 
      fetchTimesheets();
    } catch (error) {
      toast.error('Bulk approve failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<Timesheet>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        statusFilter === TIMESHEET_STATUS.PENDING ? (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ) : null
      ),
      cell: ({ row }) => {
        const ts = row.original;
        const hasException = ts.incident_tag || ts.sick_shift || ts.overtime_hours > 0;
        const canSelect = ts.status === TIMESHEET_STATUS.PENDING && !hasException;
        
        if (statusFilter !== 'pending') return null;
        if (!canSelect) return <span title="Cannot bulk approve — has exceptions" className="text-muted-foreground/40 text-xs">—</span>;

        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'staff_name',
      header: 'Staff',
      cell: ({ row }) => <span className="font-medium">{row.original.staff?.staff_name ?? 'Unknown'}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const ts = row.original;
        return ts.shift?.start_date
          ? format(parseISO(ts.shift.start_date), 'dd MMM yyyy') +
            (ts.shift.end_date && ts.shift.end_date !== ts.shift.start_date
              ? ` – ${format(parseISO(ts.shift.end_date), 'dd MMM yyyy')}`
              : '')
          : format(new Date(ts.clock_in), 'dd MMM yyyy');
      },
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.shift?.house?.house_name ?? '—',
      meta: { className: 'hidden md:table-cell' },
    },
    {
      accessorKey: 'hours',
      header: 'Hours',
      cell: ({ row }) => `${calcHours(row.original).toFixed(1)} hrs`,
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'exceptions',
      header: 'Exceptions',
      cell: ({ row }) => <ExceptionIcons ts={row.original} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? 'secondary'} appearance="light">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const ts = row.original;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            {ts.status === TIMESHEET_STATUS.PENDING ? (
              <>
                <Button 
                  size="sm" 
                  className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => openReview(ts, 'approve')}
                  disabled={!canEdit}
                  title={!canEdit ? 'Insufficient permissions' : 'Approve'}
                >
                  <Check className="size-3.5 mr-1" /> Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="h-7 px-2.5 text-xs" 
                  onClick={() => openReview(ts, 'reject')}
                  disabled={!canEdit}
                  title={!canEdit ? 'Insufficient permissions' : 'Reject'}
                >
                  <X className="size-3.5 mr-1" /> Reject
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs" onClick={() => { setSelected(ts); setAction(null); }}>
                View <ChevronRight className="size-3.5 ml-1" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [statusFilter, canEdit]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

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
                  t.status === TIMESHEET_STATUS.APPROVED &&
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
                <SelectItem value={TIMESHEET_STATUS.PENDING}>Pending</SelectItem>
                <SelectItem value={TIMESHEET_STATUS.APPROVED}>Approved</SelectItem>
                <SelectItem value={TIMESHEET_STATUS.REJECTED}>Rejected</SelectItem>
                <SelectItem value="all">All Submitted</SelectItem>
              </SelectContent>
            </Select>
            {selectedItems.length > 0 && (
              <Button size="sm" onClick={handleBulkApprove} disabled={saving || !canEdit} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="size-4 mr-1.5" />
                Approve {selectedItems.length} selected
              </Button>
            )}
          </div>

          {statusFilter === TIMESHEET_STATUS.PENDING && filtered.some(ts => ts.incident_tag || ts.sick_shift || ts.overtime_hours > 0) && (
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
            <DataGrid
              table={table}
              recordCount={filtered.length}
              isLoading={loading}
            >
              <Card>
                <CardHeader className="py-4 px-5 border-b">
                  <span className="text-sm text-muted-foreground">
                    {filtered.length} timesheet{filtered.length !== 1 ? 's' : ''}
                    {selectedItems.length > 0 && ` · ${selectedItems.length} selected`}
                  </span>
                </CardHeader>
                <CardTable>
                  <DataGridTable />
                </CardTable>
                <CardFooter>
                  <DataGridPagination />
                </CardFooter>
              </Card>
            </DataGrid>
          )}
        </div>
      </Container>

      {/* Review / Detail slide-out */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setAction(null); } }}>
        <SheetContent title="Timesheet Details" className="w-full sm:max-w-lg overflow-y-auto">
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
                    <p className="font-medium">{selected.staff?.staff_name ?? 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                    <p className="font-medium">
                      {selected.shift?.start_date
                        ? format(parseISO(selected.shift.start_date), 'EEE dd MMM yyyy') +
                          (selected.shift.end_date && selected.shift.end_date !== selected.shift.start_date
                            ? ` – ${format(parseISO(selected.shift.end_date), 'dd MMM yyyy')}`
                            : '')
                        : format(new Date(selected.clock_in), 'EEE dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                    <p className="font-medium">{selected.shift?.house?.house_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Shift Template</p>
                    <p className="font-medium capitalize">{selected.shift?.shift_template ?? '—'}</p>
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
                {selected.status === TIMESHEET_STATUS.REJECTED && selected.rejection_reason && (
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
                      disabled={saving || (action === 'reject' && !rejectionReason.trim()) || !canEdit}
                      className={action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                    >
                      {saving
                        ? 'Saving...'
                        : action === 'approve'
                        ? 'Confirm Approve'
                        : 'Confirm Reject'}
                    </Button>
                  </>
                ) : selected.status === TIMESHEET_STATUS.PENDING ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setAction('reject')}
                      disabled={!canEdit}
                    >
                      <X className="size-4 mr-1.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setAction('approve')}
                      disabled={!canEdit}
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
