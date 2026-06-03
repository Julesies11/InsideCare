'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
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
import {
  DataGridTable,
} from '@/components/ui/data-grid-table';
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
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useNavigate, Link } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { useAuth } from '@/auth/context/auth-context';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';

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
  const { hasAccess, isAdmin } = useRBAC();
  const navigate = useNavigate();

  // If Support Worker, filter by their staffId. If Admin, show all.
  const staffId = isAdmin ? undefined : user?.staff_id;
  
  const { data: tasks = [], isLoading: loading, error } = useShiftNoteTasks({ 
    staffId, 
    participantId 
  });
  
  const { houses } = useHouses();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // Filtered data based on search, house, and staff
  const filteredData = useMemo(() => {
    return tasks.filter((item) => {
      // House filter
      const matchesHouse =
        !selectedHouses.length ||
        (item.house_id && selectedHouses.includes(item.house_id));

      // Staff filter (only relevant for Admins viewing all)
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
  }, [tasks, searchQuery, selectedHouses, selectedStaff]);

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

  const handleStaffChange = (checked: boolean, staffId: string) => {
    setSelectedStaff((prev) =>
      checked ? [...prev, staffId] : prev.filter((id) => id !== staffId)
    );
  };

  // Get active houses and staff
  const activeHouses = useMemo(() => {
    return houses.filter(h => h.status === 'active');
  }, [houses]);

  const { staff } = useStaff();
  const activeStaff = useMemo(() => {
    return staff.filter(s => s.status === 'active');
  }, [staff]);

  const handleHouseChange = (checked: boolean, houseId: string) => {
    setSelectedHouses((prev) =>
      checked ? [...prev, houseId] : prev.filter((id) => id !== houseId)
    );
  };

  const isPast = (startDate: string, endDate: string | null | undefined, time: string) => {
    try {
      const effectiveEndDate = endDate || startDate;
      const shiftEnd = new Date(`${effectiveEndDate}T${time}`);
      return shiftEnd < new Date();
    } catch (e) {
      return false;
    }
  };

  const columns = useMemo<ColumnDef<ShiftNoteTask>[]>(
    () => [
      {
        id: 'shift',
        accessorFn: (row) => `${row.start_date} ${row.start_time}`,
        header: ({ column }) => (
          <DataGridColumnHeader title="Shift" column={column} />
        ),
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
            <Link 
              to={detailUrl}
              className="flex flex-col gap-0.5 group w-fit"
            >
              <span className="font-medium text-sm text-blue-700 dark:text-blue-400 group-hover:underline transition-colors">
                {format(parseISO(row.original.start_date), 'dd MMM yyyy')}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(row.original.start_time)} – {formatTime(row.original.end_time)} ({row.original.shift_template})
              </span>
            </Link>
          );
        },
        enableSorting: true,
        size: 200,
      },
      {
        id: 'participant',
        accessorFn: (row) => row.participant_names || row.participant_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Participant" column={column} />
        ),
        cell: ({ row }) => {
          const pId = row.original.participant_id;
          const pName = row.original.participant_names || row.original.participant_name;
          
          if (!pId) return <span className="text-sm font-medium">{pName || '-'}</span>;

          return (
            <Link 
              to={`${ROUTES.PARTICIPANT_DETAIL}/${pId}`}
              className="flex items-center gap-2 group/participant w-fit"
            >
              <SecureAvatar 
                src={row.original.participant_photo_url} 
                initials={getInitials(pName)} 
                className="size-6 transition-all group-hover/participant:ring-2 group-hover/participant:ring-primary/20"
                bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS} 
              />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/participant:underline transition-colors truncate max-w-[180px]">
                {pName}
              </span>
            </Link>
          );
        },
        enableSorting: true,
        size: 220,
      },
      {
        id: 'staff',
        accessorFn: (row) => row.staff_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Staff Member" column={column} />
        ),
        cell: ({ row }) => {
          const sId = row.original.staff_id;
          const sName = row.original.staff_name;
          
          if (!sId) return <span className="text-sm text-gray-700 dark:text-gray-300">{sName || '-'}</span>;

          return (
            <Link 
              to={`${ROUTES.STAFF_DETAIL}/${sId}`}
              className="flex items-center gap-2 group/staff w-fit"
            >
              <SecureAvatar 
                src={row.original.staff_photo_url} 
                initials={getInitials(sName || '??')} 
                className="size-6 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20"
                bucket={STORAGE_BUCKETS.STAFF_PHOTOS} 
              />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/staff:underline transition-colors truncate max-w-[150px]">
                {sName}
              </span>
            </Link>
          );
        },
        enableSorting: true,
        size: 180,
      },
      {
        id: 'house',
        accessorFn: (row) => row.house_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="House" column={column} />
        ),
        cell: ({ row }) => {
          const hId = row.original.house_id;
          const hName = row.original.house_name;
          
          if (!hId) return <span className="text-sm text-muted-foreground">{hName || '-'}</span>;

          return (
            <Link 
              to={`${ROUTES.HOUSE_DETAIL}/${hId}`}
              className="flex items-center gap-2 group/house w-fit"
            >
              <div className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover/house:ring-2 group-hover/house:ring-primary/20 transition-all shrink-0">
                <HouseIcon className="size-3 text-gray-600 dark:text-gray-400 group-hover/house:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/house:underline transition-colors truncate max-w-[150px]">
                {hName}
              </span>
            </Link>
          );
        },
        enableSorting: true,
        size: 180,
      },
      {
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          let badge = null;
          if (row.original.note_id) {
            badge = <Badge variant="success" appearance="light">Note Done</Badge>;
          } else if (isPast(row.original.start_date, row.original.end_date, row.original.end_time)) {
            badge = <Badge variant="destructive" appearance="light">Missing Note</Badge>;
          } else {
            badge = <Badge variant="secondary" appearance="light">Upcoming</Badge>;
          }
          
          return (
            <div className="break-words whitespace-normal text-left">
              {badge}
            </div>
          );
        },
        size: 130,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: ShiftNoteTask) => row.id,
    state: {
      pagination,
      sorting,
    },
    initialState: {
      columnPinning: {
        left: ['shift'],
      },
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const Toolbar = () => {
    return (
      <CardToolbar>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add any additional toolbar items here if needed */}
        </div>
      </CardToolbar>
    );
  };

  return (
    <>
      <DataGrid
        table={table}
        recordCount={filteredData?.length || 0}
        tableLayout={{
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
          cellBorder: true,
        }}
      >
        <Card>
          <CardHeader>
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
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="size-4" />
                    House
                    {selectedHouses.length > 0 && (
                      <Badge size="sm" variant="outline">
                        {selectedHouses.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Filter by House
                    </div>
                    <div className="space-y-3">
                      {activeHouses.map((house) => (
                        <div key={house.id} className="flex items-center gap-2.5">
                          <Checkbox
                            id={house.id}
                            checked={selectedHouses.includes(house.id)}
                            onCheckedChange={(checked) =>
                              handleHouseChange(checked === true, house.id)
                            }
                          />
                          <Label
                            htmlFor={house.id}
                            className="grow flex items-center justify-between font-normal gap-1.5"
                          >
                            {house.house_name}
                            <span className="text-muted-foreground">
                              {houseCounts[house.id] || 0}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {isAdmin && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Filter className="size-4" />
                      Staff
                      {selectedStaff.length > 0 && (
                        <Badge size="sm" variant="outline">
                          {selectedStaff.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="start">
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">
                        Filter by Staff
                      </div>
                      <ScrollArea className="h-60">
                        <div className="space-y-3">
                          {activeStaff.map((member) => (
                            <div key={member.id} className="flex items-center gap-2.5">
                              <Checkbox
                                id={member.id}
                                checked={selectedStaff.includes(member.id)}
                                onCheckedChange={(checked) =>
                                  handleStaffChange(checked === true, member.id)
                                }
                              />
                              <Label
                                htmlFor={member.id}
                                className="grow flex items-center justify-between font-normal gap-1.5"
                              >
                                {member.staff_name}
                                <span className="text-muted-foreground text-[10px]">
                                  {staffCounts[member.id] || 0}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <Toolbar />
          </CardHeader>

          {loading && <div className="p-4 text-center">Loading shift documentation tasks...</div>}
          {error && (
            <Alert variant="destructive" className="m-4">
              {error instanceof Error ? error.message : String(error)}
            </Alert>
          )}

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
    </>
  );
};

export { ShiftNotes, type ShiftNotesProps };
