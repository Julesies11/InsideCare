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
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
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
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { ParticipantFunding, useFunding } from '@/hooks/useFunding';
import { useHouses } from '@/hooks/use-houses';
import { useNavigate } from 'react-router';

function ActionsCell({ row }: { row: Row<ParticipantFunding> }) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/participants/funding/${row.original.id}`);
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
        View Details
      </Button>
    </div>
  );
}

const FundingTable = () => {
  const { fundingRecords, loading, error } = useFunding();
  const { houses } = useHouses();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);

  // Filtered data based on search and house
  const filteredData = useMemo(() => {
    return fundingRecords.filter((item) => {
      // House filter
      const matchesHouse =
        !selectedHouses.length ||
        (item.house_id && selectedHouses.includes(item.house_id));

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.participant?.name && item.participant.name.toLowerCase().includes(searchLower)) ||
        (item.registration_number && item.registration_number.toLowerCase().includes(searchLower)) ||
        (item.funding_source && item.funding_source.toLowerCase().includes(searchLower)) ||
        (item.funding_type && item.funding_type.toLowerCase().includes(searchLower));

      return matchesHouse && matchesSearch;
    });
  }, [fundingRecords, searchQuery, selectedHouses]);

  // Count of funding records per house
  const houseCounts = useMemo(() => {
    return fundingRecords.reduce((acc, item) => {
      if (item.house_id) {
        acc[item.house_id] = (acc[item.house_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [fundingRecords]);

  // Get active houses
  const activeHouses = useMemo(() => {
    return houses.filter(h => h.status === 'active');
  }, [houses]);

  const handleHouseChange = (checked: boolean, houseId: string) => {
    setSelectedHouses((prev) =>
      checked ? [...prev, houseId] : prev.filter((id) => id !== houseId)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Near Depletion':
        return 'warning';
      case 'Expired':
        return 'secondary';
      case 'Inactive':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getUsagePercentage = (used: number, allocated: number) => {
    return Math.round((used / allocated) * 100);
  };

  const columns = useMemo<ColumnDef<ParticipantFunding>[]>(
    () => [
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
        id: 'source',
        accessorFn: (row) => row.funding_source,
        header: ({ column }) => (
          <DataGridColumnHeader title="Funding Source" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" appearance="light">
            {row.original.funding_source}
          </Badge>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'type',
        accessorFn: (row) => row.funding_type,
        header: ({ column }) => (
          <DataGridColumnHeader title="Type" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.funding_type}
          </span>
        ),
        enableSorting: true,
        size: 180,
      },
      {
        id: 'registration',
        accessorFn: (row) => row.registration_number,
        header: ({ column }) => (
          <DataGridColumnHeader title="Registration Number" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {row.original.registration_number || '-'}
          </span>
        ),
        enableSorting: true,
        size: 180,
      },
      {
        id: 'budget',
        accessorFn: (row) => row.allocated_amount,
        header: ({ column }) => (
          <DataGridColumnHeader title="Budget Summary" column={column} />
        ),
        cell: ({ row }) => (
          <div className="space-y-1 w-32">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                ${row.original.used_amount.toLocaleString()}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                ${row.original.remaining_amount.toLocaleString()}
              </span>
            </div>
            <Progress
              value={getUsagePercentage(row.original.used_amount, row.original.allocated_amount)}
              className="h-2"
            />
            <div className="text-xs text-gray-500 dark:text-gray-500">
              ${row.original.allocated_amount.toLocaleString()} allocated
            </div>
          </div>
        ),
        enableSorting: false,
        size: 150,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant={getStatusColor(row.original.status)} appearance="light">
            {row.original.status}
          </Badge>
        ),
        enableSorting: true,
        size: 130,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionsCell row={row} />,
        enableSorting: false,
        size: 150,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: ParticipantFunding) => row.id,
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
    useDataGrid();
    return (
      <CardToolbar>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add any additional toolbar items here if needed */}
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
                placeholder="Search funding..."
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

        {loading && <div className="p-4 text-center">Loading funding records...</div>}
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

export { FundingTable };
