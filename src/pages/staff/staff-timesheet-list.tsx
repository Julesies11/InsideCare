import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { format, parseISO, subDays, isBefore } from 'date-fns';
import {
  Clock,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTable, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';

interface Timesheet {
  id: string;
  shift_id: string | null;
  clock_in: string;
  clock_out: string;
  actual_start: string | null;
  actual_end: string | null;
  break_minutes: number;
  shift_notes_text: string | null;
  status: 'missing' | 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  incident_tag: boolean;
  sick_shift: boolean;
  overtime_hours: number;
  travel_km: number;
  created_at: string;
  shift: {
    start_date: string;
    start_time: string;
    end_time: string;
    shift_template: string;
    house: { name: string } | null;
  } | null;
}

type TabKey = 'missing' | 'pending' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'missing',  label: 'Needs Submission',  icon: AlertCircle  },
  { key: 'pending',  label: 'Awaiting Approval', icon: Clock        },
  { key: 'approved', label: 'Approved',          icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected',          icon: XCircle      },
];

const statusVariant: Record<TabKey, 'warning' | 'secondary' | 'success' | 'destructive'> = {
  missing:  'warning',
  pending:  'secondary',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabel: Record<TabKey, string> = {
  missing:  'Needs Submission',
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
  const [activeTab, setActiveTab]   = useState<TabKey>('missing');

  const fetchTimesheets = useCallback(async () => {
    if (!user?.staff_id) { setLoading(false); return; }
    
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30).toISOString().split('T')[0];
    const todayStr = format(now, 'yyyy-MM-dd');

    // 1. Fetch existing timesheets
    const { data: existingTs } = await supabase
      .from('timesheets')
      .select(`
        id, shift_id, clock_in, clock_out, actual_start, actual_end,
        break_minutes, shift_notes_text, status, admin_notes,
        rejection_reason, submitted_at, incident_tag, sick_shift,
        overtime_hours, travel_km, created_at,
        shift:staff_shifts(id, start_date, end_date, start_time, end_time, shift_template, house:houses(name))
      `)
      .eq('staff_id', user.staff_id)
      .order('created_at', { ascending: false });

    // 2. Fetch shifts from the last 30 days
    const { data: pastShifts } = await supabase
      .from('staff_shifts')
      .select(`
        id, start_date, end_date, start_time, end_time, shift_template,
        house:houses(name)
      `)
      .eq('staff_id', user.staff_id)
      .gte('end_date', thirtyDaysAgo)
      .lte('start_date', todayStr)
      .order('start_date', { ascending: false });

    const tsList = (existingTs as any[]) || [];
    const shifts = (pastShifts as any[]) || [];

    // 3. Identify shifts that have passed but have no timesheet
    const timesheetedShiftIds = new Set(tsList.map(ts => ts.shift_id).filter(Boolean));
    
    const missingTimesheets: Timesheet[] = shifts
      .filter(s => {
        // If it already has a timesheet, skip
        if (timesheetedShiftIds.has(s.id)) return false;
        
        // Check if the shift has actually finished
        const shiftEnd = parseISO(`${s.end_date}T${s.end_time}`);
        return isBefore(shiftEnd, now);
      })
      .map(s => ({
        id: `missing-${s.id}`,
        shift_id: s.id,
        clock_in: `${s.start_date}T${s.start_time}`,
        clock_out: `${s.end_date}T${s.end_time}`,
        actual_start: null,
        actual_end: null,
        break_minutes: 0,
        shift_notes_text: null,
        status: 'missing' as const,
        admin_notes: null,
        rejection_reason: null,
        submitted_at: null,
        incident_tag: false,
        sick_shift: false,
        overtime_hours: 0,
        travel_km: 0,
        created_at: `${s.start_date}T${s.start_time}`,
        shift: {
          start_date: s.start_date,
          start_time: s.start_time,
          end_time: s.end_time,
          shift_template: s.shift_template,
          house: s.house
        }
      }));

    // 4. Combine and sort
    const combined = [...missingTimesheets, ...tsList].sort((a, b) => {
      const dateA = a.shift?.start_date || a.clock_in;
      const dateB = b.shift?.start_date || b.clock_in;
      return dateB.localeCompare(dateA);
    });

    setTimesheets(combined);
    setLoading(false);
  }, [user?.staff_id]);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const counts = TABS.reduce<Record<TabKey, number>>((acc, t) => {
    acc[t.key] = timesheets.filter(ts => ts.status === t.key).length;
    return acc;
  }, {} as Record<TabKey, number>);

  const visible = useMemo(() => timesheets.filter(ts => ts.status === activeTab), [timesheets, activeTab]);

  const columns = useMemo<ColumnDef<Timesheet>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const ts = row.original;
        return ts.shift?.start_date
          ? format(parseISO(ts.shift.start_date), 'EEE dd MMM yyyy')
          : format(new Date(ts.clock_in), 'EEE dd MMM yyyy');
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.shift?.house?.name ?? '—',
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      accessorKey: 'hours',
      header: 'Hours',
      cell: ({ row }) => {
        const ts = row.original;
        const hrs = calcHours(ts).toFixed(1);
        return (
          <div className="flex items-center gap-1.5">
            {hrs} hrs
            {ts.overtime_hours > 0 && (
              <span className="text-xs text-orange-600 font-medium">
                +{Number(ts.overtime_hours).toFixed(1)} OT
              </span>
            )}
          </div>
        );
      },
      meta: { className: 'hidden md:table-cell' },
    },
    {
      accessorKey: 'flags',
      header: 'Flags',
      cell: ({ row }) => {
        const ts = row.original;
        if (activeTab === 'missing') return null;
        return (
          <div className="flex flex-wrap items-center gap-1">
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
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]} appearance="light">
          {statusLabel[row.original.status]}
        </Badge>
      ),
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const ts = row.original;
        return (
          <div className="text-right">
            {ts.status === 'missing' ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs font-bold"
                onClick={() => navigate(`/staff/roster/${ts.shift_id}/timesheet`)}
              >
                Submit <ChevronRight className="size-3.5 ms-1" />
              </Button>
            ) : ts.status === 'rejected' && (ts.rejection_reason || ts.admin_notes) ? (
              <p className="text-xs text-destructive italic max-w-[180px] truncate">
                {ts.rejection_reason || ts.admin_notes}
              </p>
            ) : null}
          </div>
        );
      },
    },
  ], [activeTab, navigate]);

  const table = useReactTable({
    data: visible,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <Container>
        <Toolbar className="hidden sm:flex">
          <ToolbarHeading>
            <ToolbarPageTitle text="My Timesheets" />
            <ToolbarDescription>Track and submit your shift timesheets</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="py-6 sm:py-0">
        <div className="grid gap-5 lg:gap-7.5">

          {/* Tab bar */}
          <div className="flex items-center gap-1 rounded-xl border sm:border-muted/40 p-1 overflow-x-auto bg-muted/40 sm:bg-muted/40">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  table.setPageIndex(0);
                }}
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

          {/* Missing reminder banner */}
          {activeTab === 'missing' && visible.length > 0 && (
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
            <Card className="border-0 sm:border">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Loading...
              </CardContent>
            </Card>
          ) : visible.length === 0 ? (
            <Card className="border-0 sm:border">
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No timesheets here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'missing'
                      ? 'All your completed shifts have been submitted.'
                      : `No ${statusLabel[activeTab].toLowerCase()} timesheets.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataGrid
              table={table}
              recordCount={visible.length}
              isLoading={loading}
            >
              <Card className="border-0 sm:border">
                <CardHeader className="py-4 px-5 border-b">
                  <span className="text-sm text-muted-foreground">
                    {visible.length} timesheet{visible.length !== 1 ? 's' : ''}
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
    </>
  );
}
