'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import {
  Filter,
  Search,
  X,
  House as HouseIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { useShiftNoteTasks, ShiftNoteTask } from '@/hooks/use-shift-notes';
import { useHouses } from '@/hooks/use-houses';
import { useStaff } from '@/hooks/use-staff';
import { format, parseISO } from 'date-fns';
import { Alert } from '@/components/ui/alert';
import { formatTime } from '@/components/roster/roster-utils';
import { useRBAC } from '@/hooks/useRBAC';
import { Link, useLocation } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { useAuth } from '@/auth/context/auth-context';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { STATUS_FILTERS, StatusFilter, getRowStatus, isCurrent } from '../utils/status-utils';

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

interface ShiftNotesProps {
  participantId?: string;
}

const ShiftNotes = ({ participantId }: ShiftNotesProps) => {
  const { user } = useAuth();
  const { isAdmin } = useRBAC();
  const location = useLocation();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<StatusFilter[]>(['Draft', 'Overdue']);

  // If Support Worker, filter by their staffId. If Admin, show all.
  const staffId = isAdmin ? undefined : user?.staff_id;
  
  const { data: tasks = [], isLoading: loading, error } = useShiftNoteTasks({ 
    staffId, 
    participantId 
  });
  
  const { houses } = useHouses(0, 1000);
  const { staff } = useStaff();

  // Filtered data based on search, house, staff, and status filters
  const filteredData = useMemo(() => {
    return tasks.filter((item) => {
      // Status filter
      const status = getRowStatus(item);
      if (!status || !activeStatusFilters.includes(status)) return false;

      // House filter
      const matchesHouse =
        !selectedHouses.length ||
        (item.house_id && selectedHouses.includes(item.house_id));

      // Staff filter
      const matchesStaff = 
        !selectedStaff.length ||
        (item.staff_id && selectedStaff.includes(item.staff_id));

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.participant_name && item.participant_name.toLowerCase().includes(searchLower)) ||
        (item.staff_name && item.staff_name.toLowerCase().includes(searchLower)) ||
        (item.house_name && item.house_name.toLowerCase().includes(searchLower)) ||
        (item.shift_template && item.shift_template.toLowerCase().includes(searchLower));

      return matchesHouse && matchesStaff && matchesSearch;
    });
  }, [tasks, searchQuery, selectedHouses, selectedStaff, activeStatusFilters]);

  // Count of tasks per house/staff
  const { houseCounts, staffCounts } = useMemo(() => {
    return tasks.reduce((acc, item) => {
      if (item.house_id) {
        acc.houseCounts[item.house_id] = (acc.houseCounts[item.house_id] || 0) + 1;
      }
      if (item.staff_id) {
        acc.staffCounts[item.staff_id] = (acc.staffCounts[item.staff_id] || 0) + 1;
      }
      return acc;
    }, { houseCounts: {} as Record<string, number>, staffCounts: {} as Record<string, number> });
  }, [tasks]);

  const activeHouses = useMemo(() => houses.filter(h => h.status === 'active'), [houses]);
  const activeStaff = useMemo(() => staff.filter(s => s.status === 'active'), [staff]);

  const handleHouseChange = (checked: boolean, houseId: string) => {
    setSelectedHouses((prev) => checked ? [...prev, houseId] : prev.filter((id) => id !== houseId));
  };

  const handleStaffChange = (checked: boolean, staffId: string) => {
    setSelectedStaff((prev) => checked ? [...prev, staffId] : prev.filter((id) => id !== staffId));
  };

  const columns = useMemo<ColumnDef<ShiftNoteTask>[]>(
    () => [
      {
        id: 'status_strip',
        header: '',
        cell: ({ row }) => {
          const status = getRowStatus(row.original);
          let colorClass = 'bg-gray-200';
          
          switch (status) {
            case 'Completed': colorClass = 'bg-emerald-500'; break;
            case 'Draft': colorClass = 'bg-amber-400'; break;
            case 'Overdue': colorClass = 'bg-red-600'; break;
          }
          
          return <div className={cn("absolute inset-y-0 start-0 w-1", colorClass)} />;
        },
        size: 5,
        enableSorting: false,
      },
      {
        id: 'reference_id',
        accessorFn: (row) => row.note_reference_id,
        header: ({ column }) => <DataGridColumnHeader title="Shift Note ID" column={column} />,
        cell: ({ row }) => {
          const refId = row.original.note_reference_id;
          if (!refId) return <div className="break-words whitespace-normal text-left text-sm text-gray-400 dark:text-gray-600">-</div>;
          
          const detailUrl = row.original.note_id 
            ? `${ROUTES.SHIFT_NOTES_DETAIL}/${row.original.note_id}`
            : (() => {
                const params = new URLSearchParams();
                params.set('shiftId', row.original.shift_id);
                if (row.original.participant_id) {
                  params.set('participantId', row.original.participant_id);
                }
                return `${ROUTES.SHIFT_NOTES_DETAIL}/new?${params.toString()}`;
              })();

          return (
            <div className="break-words whitespace-normal text-left flex items-center min-w-0 w-full">
              <Link 
                to={detailUrl} 
                state={{ from: location.pathname + location.search }}
                className="font-medium text-sm text-blue-700 dark:text-blue-400 group-hover:underline transition-colors break-words whitespace-normal"
              >
                {refId}
              </Link>
            </div>
          );
        },
        enableSorting: true,
        size: 155,
      },
      {
        id: 'shift',
        accessorFn: (row) => `${row.start_date} ${row.start_time}`,
        header: ({ column }) => <DataGridColumnHeader title="Shift" column={column} />,
        cell: ({ row }) => {
          const detailUrl = row.original.note_id 
            ? `${ROUTES.SHIFT_NOTES_DETAIL}/${row.original.note_id}`
            : (() => {
                const params = new URLSearchParams();
                params.set('shiftId', row.original.shift_id);
                if (row.original.participant_id) {
                  params.set('participantId', row.original.participant_id);
                }
                return `${ROUTES.SHIFT_NOTES_DETAIL}/new?${params.toString()}`;
              })();

          return (
            <div className="break-words whitespace-normal text-left flex items-center min-w-0 w-full">
              <Link 
                to={detailUrl} 
                state={{ from: location.pathname + location.search }}
                className="flex flex-col gap-0.5 group w-full min-w-0"
              >
                <span className="font-medium text-sm text-blue-700 dark:text-blue-400 group-hover:underline transition-colors break-words whitespace-normal">
                  {format(parseISO(row.original.start_date), 'dd MMM yyyy')}
                </span>
                <span className="text-xs text-gray-500 break-words whitespace-normal">
                  {formatTime(row.original.start_time)} – {formatTime(row.original.end_time)} ({row.original.shift_template})
                </span>
              </Link>
            </div>
          );
        },
        enableSorting: true,
        size: 175,
      },
      {
        id: 'participant',
        accessorFn: (row) => row.participant_names || row.participant_name,
        header: ({ column }) => <DataGridColumnHeader title="Participant" column={column} />,
        cell: ({ row }) => {
          const pId = row.original.participant_id;
          const pName = row.original.participant_names || row.original.participant_name;
          if (!pId) return <div className="break-words whitespace-normal text-left text-sm font-medium">{pName || '-'}</div>;

          return (
            <div className="break-words whitespace-normal text-left flex items-center min-w-0 w-full">
              <Link to={`${ROUTES.PARTICIPANT_DETAIL}/${pId}`} className="flex items-center gap-2 group/participant w-full min-w-0">
                <SecureAvatar 
                  src={row.original.participant_photo_url} 
                  initials={getInitials(pName)} 
                  className="size-6 transition-all group-hover/participant:ring-2 group-hover/participant:ring-primary/20 shrink-0"
                  bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS} 
                />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/participant:underline transition-colors break-words whitespace-normal">
                  {pName}
                </span>
              </Link>
            </div>
          );
        },
        enableSorting: true,
        size: 180,
      },
      {
        id: 'staff',
        accessorFn: (row) => row.staff_name,
        header: ({ column }) => <DataGridColumnHeader title="Staff Member" column={column} />,
        cell: ({ row }) => {
          const sId = row.original.staff_id;
          const sName = row.original.staff_name;
          if (!sId) return <div className="break-words whitespace-normal text-left text-sm text-gray-700 dark:text-gray-300">{sName || '-'}</div>;

          return (
            <div className="break-words whitespace-normal text-left flex items-center min-w-0 w-full">
              <Link to={`${ROUTES.STAFF_DETAIL}/${sId}`} className="flex items-center gap-2 group/staff w-full min-w-0">
                <SecureAvatar 
                  src={row.original.staff_photo_url} 
                  initials={getInitials(sName || '??')} 
                  className="size-6 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20 shrink-0"
                  bucket={STORAGE_BUCKETS.STAFF_PHOTOS} 
                />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/staff:underline transition-colors break-words whitespace-normal">
                  {sName}
                </span>
              </Link>
            </div>
          );
        },
        enableSorting: true,
        size: 150,
      },
      {
        id: 'house',
        accessorFn: (row) => row.house_name,
        header: ({ column }) => <DataGridColumnHeader title="House" column={column} />,
        cell: ({ row }) => {
          const hId = row.original.house_id;
          const hName = row.original.house_name;
          if (!hId) return <div className="break-words whitespace-normal text-left text-sm text-muted-foreground">{hName || '-'}</div>;

          return (
            <div className="break-words whitespace-normal text-left flex items-center min-w-0 w-full">
              <Link to={`${ROUTES.HOUSE_DETAIL}/${hId}`} className="flex items-center gap-2 group/house w-full min-w-0">
                <div className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover/house:ring-2 group-hover/house:ring-primary/20 transition-all shrink-0">
                  <HouseIcon className="size-3 text-gray-600 dark:text-gray-400 group-hover/house:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/house:underline transition-colors break-words whitespace-normal">
                  {hName}
                </span>
              </Link>
            </div>
          );
        },
        enableSorting: true,
        size: 130,
      },
      {
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) => {
          const status = getRowStatus(row.original);
          let badge = null;

          switch (status) {
            case 'Completed': badge = <Badge variant="success" appearance="light">Completed</Badge>; break;
            case 'Draft': badge = <Badge variant="warning" appearance="light">Draft</Badge>; break;
            case 'Overdue': badge = <Badge variant="destructive" appearance="light">Overdue</Badge>; break;
          }
          
          return <div className="break-words whitespace-normal text-left">{badge}</div>;
        },
        size: 110,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: ShiftNoteTask) => row.id,
    state: { pagination, sorting },
    initialState: { columnPinning: { left: ['status_strip', 'shift'] } },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
      tableLayout={{ width: 'fixed', columnsPinnable: true, columnsMovable: true, columnsVisibility: true, cellBorder: true }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search shifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-40"
                />
                {searchQuery.length > 0 && (
                  <Button mode="icon" variant="ghost" className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery('')}>
                    <X />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><Filter className="size-4" /> House {selectedHouses.length > 0 && <Badge size="sm" variant="outline">{selectedHouses.length}</Badge>}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">Filter by House</div>
                    <div className="space-y-3">
                      {activeHouses.map((house) => (
                        <div key={house.id} className="flex items-center gap-2.5">
                          <Checkbox id={house.id} checked={selectedHouses.includes(house.id)} onCheckedChange={(checked) => handleHouseChange(checked === true, house.id)} />
                          <Label htmlFor={house.id} className="grow flex items-center justify-between font-normal gap-1.5">{house.house_name}<span className="text-muted-foreground">{houseCounts[house.id] || 0}</span></Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {isAdmin && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline"><Filter className="size-4" /> Staff {selectedStaff.length > 0 && <Badge size="sm" variant="outline">{selectedStaff.length}</Badge>}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="start">
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">Filter by Staff</div>
                      <ScrollArea className="h-60">
                        <div className="space-y-3">
                          {activeStaff.map((member) => (
                            <div key={member.id} className="flex items-center gap-2.5">
                              <Checkbox id={member.id} checked={selectedStaff.includes(member.id)} onCheckedChange={(checked) => handleStaffChange(checked === true, member.id)} />
                              <Label htmlFor={member.id} className="grow flex items-center justify-between font-normal gap-1.5">{member.staff_name}<span className="text-muted-foreground text-[10px]">{staffCounts[member.id] || 0}</span></Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
              {STATUS_FILTERS.map((status) => (
                <Button
                  key={status}
                  variant={activeStatusFilters.includes(status) ? 'primary' : 'ghost'}
                  size="sm"
                  className={cn("h-8 px-3 text-xs font-medium transition-all", !activeStatusFilters.includes(status) && "text-muted-foreground hover:text-foreground")}
                  onClick={() => {
                    setActiveStatusFilters(prev => prev.includes(status) ? (prev.length > 1 ? prev.filter(s => s !== status) : prev) : [...prev, status]);
                  }}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
          <CardToolbar />
        </CardHeader>

        {loading && <div className="p-4 text-center">Loading shift documentation tasks...</div>}
        {error && <Alert variant="destructive" className="m-4">{error instanceof Error ? error.message : String(error)}</Alert>}

        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
};

export { ShiftNotes, type ShiftNotesProps };
