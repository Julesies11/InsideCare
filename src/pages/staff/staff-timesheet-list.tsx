import { useCallback, useEffect, useMemo, useState } from 'react';
import { checklistsApi } from '@/api/checklists.api';
import { housesApi } from '@/api/houses.api';
import { rosterApi } from '@/api/roster.api';
import { shiftNotesApi } from '@/api/shift-notes.api';
import { timesheetsApi } from '@/api/timesheets.api';
import { useAuth } from '@/auth/context/auth-context';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, isBefore, parseISO, subDays } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  House,
  XCircle,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTable,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Container } from '@/components/common/container';

interface TimesheetParticipantNote {
  participant_id: string;
  participant_name: string;
  participant_photo_url: string | null;
  note_status: 'active' | 'draft' | null;
  note_id?: string;
}

interface TimesheetChecklist {
  checklist_id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  submission_id?: string;
  is_shift_routine?: boolean;
}

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
  approved_at: string | null;
  approved_by: string | null;
  approved_by_staff: { id: string; staff_name: string } | null;
  incident_tag: boolean;
  sick_shift: boolean;
  overtime_hours: number;
  travel_km: number;
  participant_km: number;
  participant_km_description: string | null;
  travel_km_description: string | null;
  created_at: string;
  shift: {
    start_date: string;
    start_time: string;
    end_time: string;
    shift_template: string;
    house: { house_name: string } | null;
    house_id?: string;
  } | null;
  notesStatus?: 'Completed' | 'Draft' | 'Missing';
  participantNotes?: TimesheetParticipantNote[];
  shiftRoutines?: TimesheetChecklist[];
  houseChecklists?: TimesheetChecklist[];
}

function ClaimsBadges({ ts }: { ts: Timesheet }) {
  const badges: React.ReactNode[] = [];

  if (ts.overtime_hours > 0) {
    badges.push(
      <Badge
        key="overtime"
        variant="warning"
        appearance="light"
        className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold"
      >
        +{Number(ts.overtime_hours).toFixed(1)} hrs OT
      </Badge>,
    );
  }

  if (ts.travel_km > 0) {
    badges.push(
      <Badge
        key="travel"
        variant="outline"
        className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold bg-blue-50 text-blue-700 border-blue-200"
      >
        {ts.travel_km} km Travel
      </Badge>,
    );
  }

  if (ts.participant_km > 0) {
    badges.push(
      <Badge
        key="participant_km"
        variant="outline"
        className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold bg-indigo-50 text-indigo-700 border-indigo-200"
      >
        {ts.participant_km} km Driving
      </Badge>,
    );
  }

  if (ts.sick_shift) {
    badges.push(
      <Badge
        key="sick"
        variant="secondary"
        appearance="light"
        className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold bg-purple-100 text-purple-700 border-purple-200"
      >
        Sick Shift
      </Badge>,
    );
  }

  if (ts.incident_tag) {
    badges.push(
      <Badge
        key="incident"
        variant="destructive"
        appearance="light"
        className="text-[10px] py-0 h-4 px-1.5 uppercase font-bold"
      >
        Incident Tagged
      </Badge>,
    );
  }

  if (badges.length === 0) {
    return <span className="text-xs text-muted-foreground/60">—</span>;
  }

  return <div className="flex flex-wrap items-center gap-1">{badges}</div>;
}

type TabKey = 'missing' | 'pending' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'missing', label: 'Needs Submission', icon: AlertCircle },
  { key: 'pending', label: 'Awaiting Approval', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
];

const statusVariant: Record<
  TabKey,
  'warning' | 'secondary' | 'success' | 'destructive'
> = {
  missing: 'warning',
  pending: 'secondary',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabel: Record<TabKey, string> = {
  missing: 'Needs Submission',
  pending: 'Awaiting Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function calcHours(ts: Timesheet) {
  const s = ts.actual_start || ts.clock_in;
  const e = ts.actual_end || ts.clock_out;
  const mins =
    (new Date(e).getTime() - new Date(s).getTime()) / 60000 -
    (ts.break_minutes || 0);
  return Math.max(0, mins / 60);
}

export function StaffTimesheetList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize tab from location state if coming back from a form
  const [activeTab, setActiveTab] = useState<TabKey>(
    (location.state as any)?.activeTab || 'missing',
  );

  const fetchTimesheets = useCallback(async () => {
    if (!user?.staff_id) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30).toISOString().split('T')[0];
    const todayStr = format(now, 'yyyy-MM-dd');

    try {
      // 1. Fetch timesheets, past shifts, and active houses in parallel via DAL
      const [existingTs, pastShifts, activeHouses] = await Promise.all([
        timesheetsApi.listByStaff(user.staff_id),
        rosterApi.listShifts({
          staffId: user.staff_id,
          startDate: thirtyDaysAgo,
          endDate: todayStr,
        }),
        housesApi.listLightweight(),
      ]);

      const tsList = (existingTs as Timesheet[]) || [];
      const shifts = (pastShifts as any[]) || [];

      // Create a map to lookup house names by house ID
      const houseMap = new Map<string, string>();
      (activeHouses || []).forEach((h: any) => {
        if (h.id && h.name) {
          houseMap.set(h.id, h.name);
        }
      });

      // Extract unique shift IDs and house IDs
      const activeShiftIds = Array.from(
        new Set([
          ...shifts.map((s) => s.id).filter(Boolean),
          ...tsList.map((ts) => ts.shift_id).filter(Boolean),
        ]),
      ) as string[];

      const activeHouseIds = Array.from(
        new Set([
          ...shifts
            .map((s) => s.house_id || s.house?.id || (s.house as any)?.id)
            .filter(Boolean),
          ...tsList
            .map((ts) => ts.shift?.house_id || ts.shift?.house?.id)
            .filter(Boolean),
        ]),
      ) as string[];

      // 2. Fetch shift notes tasks and checklist details in parallel
      const [noteTasks, checklistDetails] = await Promise.all([
        shiftNotesApi.listNoteTasks({
          staffId: user.staff_id,
          startDate: thirtyDaysAgo,
        }),
        checklistsApi.getChecklistDetailsForShifts({
          shiftIds: activeShiftIds,
          houseIds: activeHouseIds,
          startDate: thirtyDaysAgo,
          endDate: todayStr,
        }),
      ]);

      // Helper to calculate clinical shift notes status for a shift
      const getParticipantNotes = (
        shiftId: string | null,
      ): TimesheetParticipantNote[] => {
        if (!shiftId) return [];
        return (noteTasks || [])
          .filter((t: any) => t.shift_id === shiftId && t.participant_id)
          .map((t: any) => ({
            participant_id: t.participant_id,
            participant_name: t.participant_name,
            participant_photo_url: t.participant_photo_url || null,
            note_status: t.note_status,
            note_id: t.note_id,
          }));
      };

      const getShiftNotesStatus = (
        participantNotes: TimesheetParticipantNote[],
      ) => {
        if (participantNotes.length === 0) return 'Missing';
        const statuses = participantNotes.map((p) => p.note_status);
        const allCompleted = statuses.every((s) => s === 'active');
        const hasSomeNotes = statuses.some(
          (s) => s === 'active' || s === 'draft',
        );

        if (allCompleted) return 'Completed';
        if (hasSomeNotes) return 'Draft';
        return 'Missing';
      };

      const getShiftRoutines = (
        shiftId: string | null,
      ): TimesheetChecklist[] => {
        if (!shiftId) return [];
        const assigned = (checklistDetails.assigned || []).filter(
          (ac: any) => ac.shift_id === shiftId,
        );
        return assigned.map((ac: any) => {
          const submission = (checklistDetails.submissions || []).find(
            (s: any) =>
              s.shift_id === shiftId && s.checklist_id === ac.checklist_id,
          );
          return {
            checklist_id: ac.checklist_id,
            title: ac.assignment_title,
            status: (submission?.status === 'completed'
              ? 'completed'
              : submission?.status === 'in_progress'
                ? 'in_progress'
                : 'pending') as 'completed' | 'in_progress' | 'pending',
            submission_id: submission?.id,
            is_shift_routine: true,
          };
        });
      };

      const getHouseChecklists = (
        houseId: string | null,
        date: string | null,
      ): TimesheetChecklist[] => {
        if (!houseId || !date) return [];
        const events = (checklistDetails.events || []).filter(
          (e: any) => e.house_id === houseId && e.event_date === date,
        );
        return events.map((e: any) => {
          const submission = (checklistDetails.submissions || []).find(
            (s: any) =>
              s.house_id === houseId &&
              s.scheduled_date === date &&
              s.checklist_id === e.house_checklist_id &&
              s.shift_id === null,
          );
          return {
            checklist_id: e.house_checklist_id,
            title: e.title,
            status: (submission?.status === 'completed'
              ? 'completed'
              : submission?.status === 'in_progress'
                ? 'in_progress'
                : 'pending') as 'completed' | 'in_progress' | 'pending',
            submission_id: submission?.id,
            is_shift_routine: false,
          };
        });
      };

      // 3. Identify shifts that have passed but have no timesheet
      const timesheetedShiftIds = new Set(
        tsList.map((ts) => ts.shift_id).filter(Boolean) as string[],
      );

      const missingTimesheets: Timesheet[] = shifts
        .filter((s) => {
          if (s.entry_type !== 'shift') return false;
          // If it already has a timesheet, skip
          if (timesheetedShiftIds.has(s.id)) return false;

          // Check if the shift has actually finished
          const shiftEnd = parseISO(`${s.end_date}T${s.end_time}`);
          return isBefore(shiftEnd, now);
        })
        .map((s) => {
          const partNotes = getParticipantNotes(s.id);
          const routines = getShiftRoutines(s.id);
          const houseCls = getHouseChecklists(
            s.house_id || s.house?.id || null,
            s.start_date,
          );
          const houseName =
            s.house?.house_name ||
            (s.house_id ? houseMap.get(s.house_id) : null) ||
            'Unknown House';

          return {
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
              house: { house_name: houseName },
              house_id: s.house_id,
            },
            participantNotes: partNotes,
            notesStatus: getShiftNotesStatus(partNotes),
            shiftRoutines: routines,
            houseChecklists: houseCls,
          };
        });

      // 4. Combine, attach notes status, routines, house checklists, and sort
      const combined = [...missingTimesheets, ...tsList]
        .map((ts) => {
          const shiftId = ts.shift_id;
          const houseId =
            ts.shift?.house_id || (ts.shift as any)?.house?.id || null;
          const dateStr =
            ts.shift?.start_date || ts.clock_in?.split('T')[0] || null;

          const partNotes = ts.participantNotes || getParticipantNotes(shiftId);
          const routines = ts.shiftRoutines || getShiftRoutines(shiftId);
          const houseCls =
            ts.houseChecklists || getHouseChecklists(houseId, dateStr);

          let houseObj = ts.shift?.house;
          if (Array.isArray(houseObj)) {
            houseObj = (houseObj as any)[0];
          }
          if (!houseObj && houseId) {
            const mappedName = houseMap.get(houseId);
            if (mappedName) {
              houseObj = { house_name: mappedName };
            }
          }

          return {
            ...ts,
            shift: ts.shift
              ? {
                  ...ts.shift,
                  house: houseObj,
                }
              : null,
            participantNotes: partNotes,
            notesStatus: ts.notesStatus || getShiftNotesStatus(partNotes),
            shiftRoutines: routines,
            houseChecklists: houseCls,
          };
        })
        .sort((a, b) => {
          const dateA = a.shift?.start_date || a.clock_in || '';
          const dateB = b.shift?.start_date || b.clock_in || '';
          return dateB.localeCompare(dateA);
        });

      setTimesheets(combined);
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.staff_id]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const counts = TABS.reduce<Record<TabKey, number>>(
    (acc, t) => {
      acc[t.key] = timesheets.filter((ts) => ts.status === t.key).length;
      return acc;
    },
    {} as Record<TabKey, number>,
  );

  const visible = useMemo(
    () => timesheets.filter((ts) => ts.status === activeTab),
    [timesheets, activeTab],
  );

  const columns = useMemo<ColumnDef<Timesheet>[]>(() => {
    const shiftColumn: ColumnDef<Timesheet> = {
      accessorKey: 'date',
      header: 'Shift',
      cell: ({ row }) => {
        const ts = row.original;
        const dateStr = ts.shift?.start_date
          ? format(parseISO(ts.shift.start_date), 'EEE dd MMM yyyy')
          : format(new Date(ts.clock_in), 'EEE dd MMM yyyy');

        const path =
          ts.status === 'missing'
            ? `${ROUTES.MY_TIMESHEETS}/${ts.shift_id}`
            : `${ROUTES.MY_TIMESHEETS}/${ts.shift_id || ts.id}`;

        let rosteredTimeStr = '';
        if (ts.shift) {
          const start = ts.shift.start_time.slice(0, 5);
          const end = ts.shift.end_time.slice(0, 5);
          rosteredTimeStr = `${start} – ${end}`;
        }

        const showClocked = ts.status !== 'missing';
        let clockedStr = '';
        if (showClocked) {
          const s = ts.actual_start || ts.clock_in;
          const e = ts.actual_end || ts.clock_out;
          const startStr = format(new Date(s), 'HH:mm');
          const endStr = format(new Date(e), 'HH:mm');
          const hrs = calcHours(ts).toFixed(1);
          clockedStr = `Clocked: ${startStr} – ${endStr} (${hrs} hrs)`;
        }

        return (
          <div className="flex flex-col">
            <Link
              to={path}
              state={{ fromTab: activeTab }}
              className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors"
            >
              {dateStr}
            </Link>
            {rosteredTimeStr && (
              <span className="text-[11px] text-muted-foreground mt-0.5 font-normal">
                Rostered: {rosteredTimeStr}
              </span>
            )}
            {clockedStr && (
              <span className="text-[11px] text-gray-500 mt-0.5 font-normal">
                {clockedStr}
              </span>
            )}
          </div>
        );
      },
    };

    const houseColumn: ColumnDef<Timesheet> = {
      accessorKey: 'location',
      header: 'House',
      cell: ({ row }) => {
        const house = row.original.shift?.house;
        const houseId =
          (row.original.shift as any)?.house_id ||
          (row.original.shift as any)?.house?.id;

        if (!house || !houseId)
          return <span className="text-sm text-gray-500">—</span>;

        return (
          <Link
            to={`${ROUTES.HOUSE_DETAIL}/${houseId}`}
            className="flex items-center gap-2 group/house w-fit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover/house:ring-2 group-hover/house:ring-primary/20 transition-all shrink-0">
              <House className="size-3 text-gray-600 dark:text-gray-400 group-hover/house:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/house:underline transition-colors">
              {house.house_name}
            </span>
          </Link>
        );
      },
      meta: { className: 'hidden sm:table-cell' },
    };

    const statusColumn: ColumnDef<Timesheet> = {
      id: 'status_date',
      header:
        activeTab === 'pending'
          ? 'Awaiting Approval'
          : activeTab === 'approved'
            ? 'Approved'
            : activeTab === 'rejected'
              ? 'Rejected'
              : 'Status',
      cell: ({ row }) => {
        const ts = row.original;

        if (ts.status === 'pending' && ts.submitted_at) {
          try {
            return (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {format(new Date(ts.submitted_at), 'dd MMM yyyy')}
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {format(new Date(ts.submitted_at), 'HH:mm')}
                </span>
              </div>
            );
          } catch (e) {}
        }

        if (ts.status === 'approved' && ts.approved_at) {
          try {
            const approver = ts.approved_by_staff?.staff_name || 'Supervisor';
            return (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {approver}
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {format(new Date(ts.approved_at), 'dd MMM yyyy HH:mm')}
                </span>
              </div>
            );
          } catch (e) {}
        }

        if (ts.status === 'rejected') {
          const approver = ts.approved_by_staff?.staff_name || 'Supervisor';
          const formattedDateTime = ts.approved_at
            ? format(new Date(ts.approved_at), 'dd MMM yyyy HH:mm')
            : 'Rejected';

          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-destructive">
                {approver}
              </span>
              <span className="text-[11px] text-destructive/80 font-normal">
                {formattedDateTime}
              </span>
              {ts.rejection_reason && (
                <span className="text-[10px] text-destructive/70 italic mt-1 max-w-[200px] break-words">
                  Reason: {ts.rejection_reason}
                </span>
              )}
            </div>
          );
        }

        return <span className="text-sm text-gray-500">—</span>;
      },
      meta: { className: 'hidden md:table-cell' },
    };

    const shiftNotesColumn: ColumnDef<Timesheet> = {
      id: 'shift_notes',
      header: 'Shift Notes',
      cell: ({ row }) => {
        const participantNotes = row.original.participantNotes || [];
        if (participantNotes.length === 0) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        const completed = participantNotes.filter(
          (pn) => pn.note_status === 'active',
        ).length;
        const total = participantNotes.length;
        const variant =
          completed === total
            ? 'success'
            : completed > 0
              ? 'warning'
              : 'destructive';

        return (
          <Badge
            variant={variant}
            appearance="light"
            className="text-[10px] uppercase font-bold py-0.5 px-1.5 h-fit whitespace-nowrap"
          >
            {completed}/{total} Completed
          </Badge>
        );
      },
    };

    const checklistsColumn: ColumnDef<Timesheet> = {
      id: 'checklists',
      header: 'Checklists',
      cell: ({ row }) => {
        const routines = row.original.shiftRoutines || [];
        const houseChecklists = row.original.houseChecklists || [];
        const total = routines.length + houseChecklists.length;
        if (total === 0)
          return <span className="text-xs text-muted-foreground">—</span>;

        const completedRoutines = routines.filter(
          (r) => r.status === 'completed',
        ).length;
        const completedHouse = houseChecklists.filter(
          (c) => c.status === 'completed',
        ).length;
        const completed = completedRoutines + completedHouse;

        const variant =
          completed === total
            ? 'success'
            : completed > 0
              ? 'warning'
              : 'destructive';
        return (
          <Badge
            variant={variant}
            appearance="light"
            className="text-[10px] uppercase font-bold py-0.5 px-1.5 h-fit whitespace-nowrap"
          >
            {completed}/{total} Completed
          </Badge>
        );
      },
    };

    const actionColumn: ColumnDef<Timesheet> = {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const ts = row.original;
        const path =
          ts.status === 'missing'
            ? `${ROUTES.MY_TIMESHEETS}/${ts.shift_id}`
            : `${ROUTES.MY_TIMESHEETS}/${ts.shift_id || ts.id}`;

        return (
          <Button
            type="button"
            variant={
              ts.status === 'missing'
                ? 'primary'
                : ts.status === 'rejected'
                  ? 'warning'
                  : 'outline'
            }
            size="sm"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(path, { state: { fromTab: activeTab } });
            }}
          >
            {ts.status === 'missing'
              ? 'Submit'
              : ts.status === 'rejected'
                ? 'Edit'
                : 'View'}
          </Button>
        );
      },
      meta: { className: 'text-right' },
    };

    const claimsColumn: ColumnDef<Timesheet> = {
      id: 'claims',
      header: 'Claims',
      cell: ({ row }) => <ClaimsBadges ts={row.original} />,
      meta: { className: 'hidden lg:table-cell' },
    };

    // Tab-specific columns
    if (activeTab === 'missing') {
      return [
        shiftColumn,
        houseColumn,
        shiftNotesColumn,
        checklistsColumn,
        actionColumn,
      ];
    }

    if (activeTab === 'rejected') {
      return [
        shiftColumn,
        houseColumn,
        statusColumn,
        shiftNotesColumn,
        checklistsColumn,
        claimsColumn,
        actionColumn,
      ];
    }

    // Default column set for pending / approved
    return [
      shiftColumn,
      houseColumn,
      statusColumn,
      shiftNotesColumn,
      checklistsColumn,
      claimsColumn,
      actionColumn,
    ];
  }, [activeTab, navigate, user]);

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
            <ToolbarDescription>
              Track and submit your shift timesheets
            </ToolbarDescription>
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
                  <span
                    className={`inline-flex items-center justify-center size-5 rounded-full text-xs font-semibold ${
                      activeTab === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
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
                  {visible.length} timesheet{visible.length !== 1 ? 's' : ''}{' '}
                  rejected
                </p>
                <p className="text-sm text-destructive/80 mt-0.5">
                  Review the rejection reasons below and contact your supervisor
                  if needed.
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
                  {visible.length} timesheet{visible.length !== 1 ? 's' : ''}{' '}
                  awaiting submission
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Please submit your timesheets as soon as possible after each
                  shift.
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
