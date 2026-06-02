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
  Edit,
  Filter,
  Search,
  X,
  Plus,
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
import { useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { useAuth } from '@/auth/context/auth-context';

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

  const canEdit = hasAccess({ 
    resource: RBAC_MODULES.SHIFT_NOTES, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

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

  const handleAction = useCallback((task: ShiftNoteTask) => {
    if (task.note_id) {
      navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/${task.note_id}`);
    } else {
      // Pre-fill shift and participant for new note
      const params = new URLSearchParams();
      params.set('shiftId', task.shift_id);
      if (task.participant_id) {
        params.set('participantId', task.participant_id);
      }
      navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/new?${params.toString()}`);
    }
  }, [navigate]);

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
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
              {format(parseISO(row.original.start_date), 'dd MMM yyyy')}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(row.original.start_time)} – {formatTime(row.original.end_time)} ({row.original.shift_template})
            </span>
          </div>
        ),
        enableSorting: true,
        size: 200,
      },
      {
        id: 'participant',
        accessorFn: (row) => row.participant_names || row.participant_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Participant" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {row.original.participant_names || row.original.participant_name || '-'}
          </span>
        ),
        enableSorting: true,
        size: 220,
      },
      {
        id: 'staff',
        accessorFn: (row) => row.staff_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Staff Member" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.staff_name || '-'}
          </span>
        ),
        enableSorting: true,
        size: 180,
      },
      {
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          if (row.original.note_id) {
            return <Badge variant="success" appearance="light">Note Done</Badge>;
          }
          
          if (isPast(row.original.start_date, row.original.end_date, row.original.end_time)) {
            return <Badge variant="destructive" appearance="light">Missing Note</Badge>;
          }
          
          return <Badge variant="secondary" appearance="light">Upcoming</Badge>;
        },
        size: 130,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction(row.original)}
              className="h-8"
            >
              {row.original.note_id ? (
                <>
                  <Edit className="size-4 me-1.5" />
                  {canEdit ? 'Edit' : 'View'}
                </>
              ) : (
                <>
                  <Plus className="size-4 me-1.5" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        ),
        enableSorting: false,
        size: 120,
      },
    ],
    [canEdit, handleAction]
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
