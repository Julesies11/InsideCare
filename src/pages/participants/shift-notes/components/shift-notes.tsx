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
  Edit,
  Filter,
  Search,
  Tag,
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

import { ShiftNote, useShiftNotes } from '@/hooks/useShiftNotes';
import { useHouses } from '@/hooks/use-houses';
import { format } from 'date-fns';
import { Alert } from '@/components/ui/alert';
import { EditShiftNoteDialog } from './edit-shift-note-dialog';

interface ShiftNotesProps {
}

const ShiftNotes = ({}: ShiftNotesProps) => {
  const { shiftNotes, loading, error, updateShiftNote, createShiftNote, refetch } = useShiftNotes();
  const { houses } = useHouses();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [editNote, setEditNote] = useState<ShiftNote | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'create'>('edit');

  // Filtered data based on search and house
  const filteredData = useMemo(() => {
    return shiftNotes.filter((item) => {
      // House filter
      const matchesHouse =
        !selectedHouses.length ||
        (item.house_id && selectedHouses.includes(item.house_id));

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.participant?.name && item.participant.name.toLowerCase().includes(searchLower)) ||
        (item.staff?.name && item.staff.name.toLowerCase().includes(searchLower)) ||
        (item.house?.name && item.house.name.toLowerCase().includes(searchLower)) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower)) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)));

      return matchesHouse && matchesSearch;
    });
  }, [shiftNotes, searchQuery, selectedHouses]);

  // Count of shift notes per house
  const houseCounts = useMemo(() => {
    return shiftNotes.reduce((acc, item) => {
      if (item.house_id) {
        acc[item.house_id] = (acc[item.house_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [shiftNotes]);

  // Get active houses
  const activeHouses = useMemo(() => {
    return houses.filter(h => h.status === 'active');
  }, [houses]);

  const handleHouseChange = (checked: boolean, houseId: string) => {
    setSelectedHouses((prev) =>
      checked ? [...prev, houseId] : prev.filter((id) => id !== houseId)
    );
  };

  const handleEditNote = (note: ShiftNote) => {
    setEditNote(note);
    setDialogMode('edit');
    setIsEditDialogOpen(true);
  };

  const ActionsCell = ({ row }: { row: Row<ShiftNote> }) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditNote(row.original)}
          className="h-8"
        >
          <Edit className="size-4 me-1.5" />
          Edit
        </Button>
      </div>
    );
  };

  const columns = useMemo<ColumnDef<ShiftNote>[]>(
    () => [
      {
        id: 'date',
        accessorFn: (row) => row.shift_date,
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {format(new Date(row.original.shift_date), 'dd MMM yyyy')}
            </span>
            {row.original.shift_time && (
              <span className="text-xs text-gray-500">
                {row.original.shift_time}
              </span>
            )}
          </div>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'participant',
        accessorFn: (row) => row.participant?.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Participant" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {row.original.participant?.name || '-'}
          </span>
        ),
        enableSorting: true,
        size: 200,
      },
      {
        id: 'staff',
        accessorFn: (row) => row.staff?.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Staff Member" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.staff?.name || '-'}
          </span>
        ),
        enableSorting: true,
        size: 200,
      },
      {
        id: 'house',
        accessorFn: (row) => row.house?.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="House" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.house?.name || '-'}
          </span>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'tags',
        header: ({ column }) => (
          <DataGridColumnHeader title="Tags" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                <Tag className="size-2.5 me-1" />
                {tag}
              </Badge>
            )) || '-'}
          </div>
        ),
        enableSorting: false,
        size: 200,
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
                  placeholder="Search notes..."
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
            </div>
            <Toolbar />
          </CardHeader>

          {loading && <div className="p-4 text-center">Loading shift notes...</div>}
          {error && (
            <Alert variant="destructive" className="m-4">
              {error}
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

      <EditShiftNoteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        shiftNote={editNote}
        onSave={updateShiftNote}
        onCreate={createShiftNote}
        onSuccess={() => refetch(true)}
        mode={dialogMode}
      />
    </>
  );
};

export { ShiftNotes, type ShiftNotesProps };
