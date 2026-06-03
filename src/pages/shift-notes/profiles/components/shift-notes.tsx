'use client';

import { useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useShiftNotes, ShiftNote } from '@/hooks/use-shift-notes';
import { useHouses } from '@/hooks/use-houses';
import { useStaff } from '@/hooks/use-staff';
import { useNavigate, Link } from 'react-router';
import { format } from 'date-fns';
import { ROUTES } from '@/config/routes.config';
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

const ShiftNotes = () => {
  const { shiftNotes, loading, error } = useShiftNotes();
  const { houses } = useHouses();
  const { staff } = useStaff();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const handleHouseChange = (checked: boolean, houseId: string) => {
    setSelectedHouses((prev) =>
      checked ? [...prev, houseId] : prev.filter((id) => id !== houseId)
    );
  };

  const handleStaffChange = (checked: boolean, staffId: string) => {
    setSelectedStaff((prev) =>
      checked ? [...prev, staffId] : prev.filter((id) => id !== staffId)
    );
  };

  // Filtered data
  const filteredData = useMemo(() => {
    return shiftNotes.filter((item) => {
      // House filter
      const matchesHouse =
        !selectedHouses.length ||
        (item.house_id && selectedHouses.includes(item.house_id));

      // Staff filter
      const matchesStaff =
        !selectedStaff.length ||
        (item.staff_id && selectedStaff.includes(item.staff_id));

      // Search across all columns
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.participant?.participant_name && item.participant.participant_name.toLowerCase().includes(searchLower)) ||
        (item.staff?.staff_name && item.staff.staff_name.toLowerCase().includes(searchLower)) ||
        (item.house?.house_name && item.house.house_name.toLowerCase().includes(searchLower)) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower)) ||
        (item.full_note && item.full_note.toLowerCase().includes(searchLower));

      return matchesHouse && matchesStaff && matchesSearch;
    });
  }, [shiftNotes, searchQuery, selectedHouses, selectedStaff]);

  // Count of shift notes per house
  const houseCounts = useMemo(() => {
    return shiftNotes.reduce((acc, item) => {
      if (item.house_id) {
        acc[item.house_id] = (acc[item.house_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [shiftNotes]);

  // Count of shift notes per staff
  const staffCounts = useMemo(() => {
    return shiftNotes.reduce((acc, item) => {
      if (item.staff_id) {
        acc[item.staff_id] = (acc[item.staff_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [shiftNotes]);

  const columns = useMemo<ColumnDef<ShiftNote>[]>(
    () => [
      {
        id: 'start_date',
        accessorFn: (row) => row.start_date,
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" column={column} />
        ),
        cell: ({ row }) => (
          <Link 
            to={`${ROUTES.SHIFT_NOTES_DETAIL}/${row.original.id}`}
            className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors break-words whitespace-normal w-full max-w-full block text-left"
          >
            {format(new Date(row.original.start_date), 'MMM dd, yyyy')}
          </Link>
        ),
        enableSorting: true,
        size: 130,
      },
      {
        id: 'shift_time',
        accessorFn: (row) => row.shift_time,
        header: ({ column }) => (
          <DataGridColumnHeader title="Time" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-normal break-words whitespace-normal text-left block">
            {row.original.shift_time || '-'}
          </span>
        ),
        enableSorting: true,
        size: 100,
      },
      {
        id: 'participant',
        accessorFn: (row) => row.participant?.participant_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Participant" column={column} />
        ),
        cell: ({ row }) => {
          const participant = row.original.participant;
          if (!participant) return <span className="text-muted-foreground italic text-xs">General Note</span>;

          return (
            <Link 
              to={`${ROUTES.PARTICIPANT_DETAIL}/${participant.id}`}
              className="flex items-center gap-2 group/participant w-fit"
            >
              <SecureAvatar 
                src={participant.photo_url} 
                initials={getInitials(participant.participant_name)} 
                className="size-6 transition-all group-hover/participant:ring-2 group-hover/participant:ring-primary/20"
                bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS} 
              />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/participant:underline transition-colors truncate max-w-[150px]">
                {participant.participant_name}
              </span>
            </Link>
          );
        },
        enableSorting: true,
        size: 180,
      },
      {
        id: 'staff',
        accessorFn: (row) => row.staff?.staff_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Staff" column={column} />
        ),
        cell: ({ row }) => {
          const staffMember = row.original.staff;
          if (!staffMember) return <span className="text-muted-foreground">-</span>;

          return (
            <Link 
              to={`${ROUTES.STAFF_DETAIL}/${staffMember.id}`}
              className="flex items-center gap-2 group/staff w-fit"
            >
              <SecureAvatar 
                src={staffMember.photo_url} 
                initials={getInitials(staffMember.staff_name)} 
                className="size-6 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20"
                bucket={STORAGE_BUCKETS.STAFF_PHOTOS} 
              />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/staff:underline transition-colors truncate max-w-[120px]">
                {staffMember.staff_name}
              </span>
            </Link>
          );
        },
        enableSorting: true,
        size: 150,
      },
      {
        id: 'house',
        accessorFn: (row) => row.house?.house_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="House" column={column} />
        ),
        cell: ({ row }) => {
          const house = row.original.house;
          if (!house) return <span className="text-muted-foreground">-</span>;

          return (
            <Link 
              to={`${ROUTES.HOUSE_DETAIL}/${house.id}`}
              className="flex items-center gap-2 group/house w-fit"
            >
              <div className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover/house:ring-2 group-hover/house:ring-primary/20 transition-all shrink-0">
                <HouseIcon className="size-3 text-gray-600 dark:text-gray-400 group-hover/house:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/house:underline transition-colors truncate max-w-[120px]">
                {house.house_name}
              </span>
            </Link>
          );
        },
        enableSorting: true,
        size: 150,
      },
      {
        id: 'notes',
        accessorFn: (row) => row.notes,
        header: ({ column }) => (
          <DataGridColumnHeader title="Notes" column={column} />
        ),
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate text-foreground font-normal break-words whitespace-normal text-left block">
            {row.original.notes || row.original.full_note?.substring(0, 100) || '-'}
          </div>
        ),
        enableSorting: false,
        size: 300,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: ShiftNote) => row.id,
    state: {
      pagination,
      sorting,
    },
    initialState: {
      columnPinning: {
        left: ['start_date'],
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
          {/* Placeholder for future toolbar items */}
        </div>
      </CardToolbar>
    );
  };

  return (
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
                placeholder="Search Shift Notes..."
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
                  <Filter />
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
                    {houses.map((house) => (
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter />
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
                  <div className="space-y-3">
                    {staff.map((member) => (
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
                          {member.name}
                          <span className="text-muted-foreground">
                            {staffCounts[member.id] || 0}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Toolbar />
        </CardHeader>

        {loading && <div className="p-4 text-center">Loading shift notes...</div>}
        {error && <div className="p-4 text-center text-destructive">{error}</div>}

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

export { ShiftNotes };
