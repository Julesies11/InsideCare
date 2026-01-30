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
  Eye,
  Filter,
  Search,
  X,
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
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
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
import { useShiftNotes, ShiftNote } from '@/hooks/useShiftNotes';
import { useHouses } from '@/hooks/use-houses';
import { useStaff } from '@/hooks/useStaff';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';

function ActionsCell({ row }: { row: Row<ShiftNote> }) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/shift-notes/detail/${row.original.id}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleView}
        className="h-8"
      >
        <Eye className="size-4 me-1.5" />
        View
      </Button>
    </div>
  );
}

const ShiftNotes = () => {
  const { shiftNotes, loading, error } = useShiftNotes();
  const { houses } = useHouses();
  const { staff } = useStaff();
  const navigate = useNavigate();

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
        (item.participant?.name && item.participant.name.toLowerCase().includes(searchLower)) ||
        (item.staff?.name && item.staff.name.toLowerCase().includes(searchLower)) ||
        (item.house?.name && item.house.name.toLowerCase().includes(searchLower)) ||
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
        id: 'shift_date',
        accessorFn: (row) => row.shift_date,
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-normal">
            {format(new Date(row.original.shift_date), 'MMM dd, yyyy')}
          </span>
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
          <span className="text-foreground font-normal">
            {row.original.shift_time || '-'}
          </span>
        ),
        enableSorting: true,
        size: 100,
      },
      {
        id: 'participant',
        accessorFn: (row) => row.participant?.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Participant" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-normal">
            {row.original.participant?.name || 'General Note'}
          </span>
        ),
        enableSorting: true,
        size: 180,
      },
      {
        id: 'staff',
        accessorFn: (row) => row.staff?.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Staff" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-normal">
            {row.original.staff?.name || '-'}
          </span>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'house',
        accessorFn: (row) => row.house?.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="House" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-normal">
            {row.original.house?.name || '-'}
          </span>
        ),
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
          <div className="max-w-[300px] truncate text-foreground font-normal">
            {row.original.notes || row.original.full_note?.substring(0, 100) || '-'}
          </div>
        ),
        enableSorting: false,
        size: 300,
      },
      {
        id: 'tags',
        header: 'Tags',
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {row.original.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" appearance="light" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionsCell row={row} />,
        enableSorting: false,
        size: 120,
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
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const Toolbar = () => {
    const { table } = useDataGrid();
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
                          {house.name}
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
