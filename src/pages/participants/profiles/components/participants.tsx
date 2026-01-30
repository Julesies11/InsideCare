'use client';

import { useMemo, useState } from 'react';
import { RiCheckboxCircleFill } from '@remixicon/react';
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
  EllipsisVertical,
  Filter,
  Search,
  Settings2,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

import { Participant, ParticipantWithHouse }  from '@/models/participant';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Archive, Edit, Eye } from 'lucide-react';
import { useParticipants } from '@/hooks/use-participants';
import { useHouses } from '@/hooks/use-houses';
import { useNavigate } from 'react-router';

function ActionsCell({ row }: { row: Row<ParticipantWithHouse> }) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/participants/detail/${row.original.id}`);
  };

  const handleEdit = () => {
    navigate(`/participants/detail/${row.original.id}/edit`);
  };

  const handleArchive = async () => {
    // TODO: Implement archive participant (set is_active to false)
    console.log('Archive participant:', row.original.id);
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="h-8"
      >
        <Edit className="size-4 me-1.5" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleArchive}
        className="h-8"
      >
        <Archive className="size-4 me-1.5" />
        Archive
      </Button>
    </div>
  );
}

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const Participants = () => {
  const { participants, loading, error, refetch } = useParticipants();
  const { houses } = useHouses();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Filtered data based on search, house, and active status
  const filteredData = useMemo(() => {
    return participants.filter((item) => {
      // Active status filter
      if (showActiveOnly && !item.is_active) {
        return false;
      }

      // House filter
      const matchesHouse =
        !selectedHouses.length ||
        (item.house_id && selectedHouses.includes(item.house_id));

      // Search across all columns
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.email && item.email.toLowerCase().includes(searchLower)) ||
        (item.phone && item.phone.toLowerCase().includes(searchLower)) ||
        (item.ndis_number && item.ndis_number.toLowerCase().includes(searchLower)) ||
        ((item as ParticipantWithHouse).house_name && (item as ParticipantWithHouse).house_name!.toLowerCase().includes(searchLower)) ||
        (item.address && item.address.toLowerCase().includes(searchLower));

      return matchesHouse && matchesSearch;
    });
  }, [participants, searchQuery, selectedHouses, showActiveOnly]);

  // Count of participants per house
  const houseCounts = useMemo(() => {
    return participants.reduce((acc, item) => {
      if (item.house_id) {
        acc[item.house_id] = (acc[item.house_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [participants]);

  // Get active houses (houses with status 'active')
  const activeHouses = useMemo(() => {
    return houses.filter(h => h.status === 'active');
  }, [houses]);

  const handleHouseChange = (checked: boolean, houseId: string) => {
    setSelectedHouses((prev) =>
      checked ? [...prev, houseId] : prev.filter((id) => id !== houseId)
    );
  };

  const columns = useMemo<ColumnDef<ParticipantWithHouse>[]>(
    () => [
      {
        id: 'participant',
        accessorFn: (row) => row.name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Participant" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              {row.original.photo_url && (
                <AvatarImage src={row.original.photo_url} alt={row.original.name} />
              )}
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="leading-none font-medium text-sm text-mono hover:text-primary">
                {row.original.name || '-'}
              </span>
              {row.original.date_of_birth && (
                <span className="text-sm text-secondary-foreground font-normal">
                  DOB: {row.original.date_of_birth}
                </span>
              )}
            </div>
          </div>
        ),
        enableSorting: true,
        size: 300,
      },
      {
        id: 'ndis',
        accessorFn: (row) => row.ndis_number,
        header: ({ column }) => (
          <DataGridColumnHeader title="NDIS Number" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-normal">
            {row.original.ndis_number || '-'}
          </span>
        ),
        enableSorting: true,
        size: 165,
      },
      {
        id: 'house',
        accessorFn: (row) => (row as ParticipantWithHouse).house_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="House Assignment" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground font-normal">
            {(row.original as ParticipantWithHouse).house_name || '-'}
          </span>
        ),
        enableSorting: true,
        size: 165,
      },
      {
        id: 'status',
        accessorFn: (row) => row.is_active,
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'success' : 'secondary'} appearance="light">
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
        enableSorting: true,
        size: 165,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionsCell row={row} />,
        enableSorting: false,
        size: 280,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: ParticipantWithHouse) => row.id,
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
          <Label htmlFor="active-users-toggle" className="text-sm">
            Active Users
          </Label>
          <Switch 
            size="sm" 
            id="active-users-toggle" 
            checked={showActiveOnly}
            onCheckedChange={setShowActiveOnly}
          />
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
                placeholder="Search Participants..."
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

        {loading && <div className="p-4 text-center">Loading participants...</div>}
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
  );
};

export { Participants };
