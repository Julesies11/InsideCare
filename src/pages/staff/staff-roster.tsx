import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/auth/context/auth-context';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { ClipboardList, Calendar, List, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTable } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import { StaffRosterCalendar } from '@/pages/roster-board/components/staff-roster-calendar';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode } from '@/components/roster/roster-utils';
import { LeaveDialog } from '@/components/roster/leave-dialog';
import { useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { useStaffRoster, useStaffShiftsPaginated, RosterEntry as Entry } from '@/hooks/use-staff-roster';
import { Pencil, Search } from 'lucide-react';
import { ROUTES } from '@/config/routes.config';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { useMemo } from 'react';
import { 
  ColumnDef, 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel,
  SortingState
} from '@tanstack/react-table';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

type TabView = 'calendar' | 'list';

export function StaffRoster() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Tab
  const [tab, setTab] = useState<TabView>('calendar');

  // Calendar state
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showLeave, setShowLeave] = useState(true);
  const [showEvents, setShowEvents] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Leave Dialog state
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // List state
  const { data: entries = [], isLoading: loading, refetch } = useStaffRoster(user?.staff_id);

  // Paginated shifts for list view
  const { data: paginatedData, isLoading: paginatedLoading } = useStaffShiftsPaginated({
    staffId: user?.staff_id,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    sorting: sorting.map(s => ({ id: s.id, desc: s.desc }))
  });

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'today') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'today') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const isPast = (entry: Entry) =>
    entry.start_date <= new Date().toISOString().split('T')[0];

  const handleEditLeave = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setShowLeaveDialog(true);
  };

  const handleLeaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['staff-roster', user?.staff_id] });
    queryClient.invalidateQueries({ queryKey: ['leave-requests', user?.staff_id] });
    refetch();
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'start_date',
      header: ({ column }) => <DataGridColumnHeader title="From" column={column} />,
      cell: ({ row }) => {
        const dateStr = format(new Date(row.original.start_date + 'T00:00:00'), 'EEE dd MMM yyyy');
        return (
          <Link 
            to={`${ROUTES.MY_ROSTER}/${row.original.id}/timesheet`}
            className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors"
          >
            {dateStr}
          </Link>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'end_date',
      header: ({ column }) => <DataGridColumnHeader title="To" column={column} />,
      cell: ({ row }) => format(new Date((row.original.end_date || row.original.start_date) + 'T00:00:00'), 'EEE dd MMM yyyy'),
      enableSorting: true,
    },
    {
      accessorKey: 'entry_type',
      header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
      cell: () => <Badge variant="secondary" appearance="light">Shift</Badge>,
      enableSorting: false,
    },
    {
      accessorKey: 'details',
      header: ({ column }) => <DataGridColumnHeader title="Details" column={column} />,
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="text-muted-foreground">{row.original.shift_template || 'Standard'}</span>
          <span className="text-[10px] text-muted-foreground italic">
            {row.original.start_time?.slice(0, 5)} – {row.original.end_time?.slice(0, 5)}
            {row.original.house?.house_name && (
              <>
                {' at '}
                <Link 
                  to={`${ROUTES.HOUSE_DETAIL}/${row.original.house_id || row.original.house.id}`}
                  className="text-blue-700 dark:text-blue-400 hover:underline transition-colors not-italic font-medium"
                >
                  {row.original.house.house_name}
                </Link>
              </>
            )}
          </span>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: ({ column }) => <DataGridColumnHeader title="Action" column={column} />,
      cell: ({ row }) => {
        const entry = row.original;
        if (entry.has_timesheet) {
          return <Badge variant="success" appearance="light">Submitted</Badge>;
        }
        if (isPast(entry)) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/my-roster/${entry.id}/timesheet`)}
            >
              <ClipboardList className="size-3.5 me-1.5" />
              Timesheet
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">Upcoming</span>;
      },
      enableSorting: false,
    }
  ], [navigate]);

  const table = useReactTable({
    data: paginatedData?.data || [],
    columns,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: (updater) => {
      const nextPagination = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(nextPagination);
    },
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(nextSorting);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil((paginatedData?.count || 0) / pagination.pageSize),
  });

  return (
    <>
      <Container>
        <Toolbar className="hidden sm:flex">
          <ToolbarHeading>
            <ToolbarPageTitle text="My Roster" />
            <ToolbarDescription>View your scheduled shifts</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-3 gap-1.5 ${
                  tab === 'calendar'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('calendar')}
              >
                <Calendar className="size-3.5" />
                Calendar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-3 gap-1.5 ${
                  tab === 'list'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('list')}
              >
                <List className="size-3.5" />
                List
              </Button>
            </div>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="py-6 sm:py-0">
        {tab === 'calendar' ? (
          user?.staff_id ? (
            <div className="grid gap-5 lg:gap-7.5">
              <Card className="border-0 sm:border">
                <CardContent className="p-4 lg:p-6">
                  <RosterCalendarHeader
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onNavigate={navigatePeriod}
                    getPeriodLabel={getPeriodLabel}
                    showStaffFilter={false}
                    showParticipantFilter={false}
                    showHouseFilter={false}
                    showShiftTemplateFilter={false}
                    showLeave={showLeave}
                    onShowLeaveChange={setShowLeave}
                    showEvents={showEvents}
                    onShowEventsChange={setShowEvents}
                  />
                </CardContent>
              </Card>
              <StaffRosterCalendar
                staffId={user.staff_id}
                viewMode={viewMode}
                currentDate={currentDate}
                houseFilter="all"
                participantFilter="all"
                shiftTemplateFilter="all"
                canEdit={false}
                showLeave={showLeave}
                includeEvents={showEvents}
                isPersonal={true}
                checklists={[]}
                onEditLeave={(leave) => handleEditLeave(leave.id)}
              />
            </div>
          ) : (
            <Card className="border-0 sm:border">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No staff profile linked to your account.
              </CardContent>
            </Card>
          )
        ) : (
          <div className="grid gap-5 lg:gap-7.5">
            <Card className="border-0 sm:border">
              <CardHeader className="py-4 px-5 flex items-center">
                <div className="relative w-full sm:w-64 ml-auto">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search shifts..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <DataGrid
                table={table}
                recordCount={paginatedData?.count || 0}
                isLoading={paginatedLoading}
              >
                <CardContent className="p-0">
                  <DataGridTable />
                </CardContent>
                <div className="border-t p-4">
                  <DataGridPagination />
                </div>
              </DataGrid>
            </Card>
          </div>
        )}
      </Container>

      <LeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        leaveId={selectedLeaveId}
        onSuccess={handleLeaveSuccess}
      />
    </>
  );
}
