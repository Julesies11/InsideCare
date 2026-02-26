'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Search,
  House as HouseIcon,
  X,
  Archive,
  Edit,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusFilter, StatusOption } from '@/components/ui/status-filter';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { House } from '@/models/house';
import { useHouses } from '@/hooks/use-houses';
import { useParticipants } from '@/hooks/use-participants';
import { useHouseStaffAssignments } from '@/hooks/useHouseStaffAssignments';
import { useNavigate } from 'react-router';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/auth/context/auth-context';
import { parseSupabaseError } from '@/lib/error-parser';

import { useDebouncedSearchParams } from '@/hooks/use-debounced-search-params';
import { Skeleton } from '@/components/ui/skeleton';

const HOUSE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active', badge: 'success' },
  { value: 'inactive', label: 'Inactive', badge: 'secondary' },
  { value: 'maintenance', label: 'Maintenance', badge: 'warning' },
];

// Helper function to get participants for a house
function getHouseParticipants(houseId: string, allParticipants: any[]) {
  return allParticipants
    .filter(participant => participant.house_id === houseId && participant.status === 'active')
    .map(participant => participant.name)
    .filter(name => name);
}

// Helper function to get active staff count for a house
function getHouseStaffCount(houseId: string, houseStaffAssignments: any[]) {
  return houseStaffAssignments
    .filter(assignment => assignment.house_id === houseId && !assignment.end_date)
    .length;
}

// Helper function to create Google Maps URL from address
function createGoogleMapsUrl(address: string) {
  if (!address) return '#';
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

function ActionsCell({ row, updateHouse }: { row: Row<House>; updateHouse: (id: string, updates: Partial<House>) => Promise<{ data: any; error: string | null }> }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEdit = () => {
    navigate(`/houses/detail/${row.original.id}`);
  };

  const handleArchive = async () => {
    try {
      const { error } = await updateHouse(row.original.id, { status: 'inactive' });

      if (error) {
        const parsedError = parseSupabaseError(error);
        toast.error(parsedError.title, { description: parsedError.description });
        throw new Error(parsedError.description);
      }

      // Log activity
      await logActivity({
        activityType: 'update',
        entityType: 'house',
        entityId: row.original.id,
        entityName: row.original.name,
        userName: user?.email || 'Unknown user',
        customDescription: 'House archived (set to inactive)',
      });

      toast.success('House archived successfully');
    } catch (error) {
      console.error('Error archiving house:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
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

export function Houses() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useDebouncedSearchParams(300);

  // Helper functions to parse URL params into initial state
  const getInitialPagination = (): PaginationState => ({
    pageIndex: Math.max(0, parseInt(searchParams.get('page') || '1') - 1), // Convert to 0-indexed
    pageSize: parseInt(searchParams.get('pageSize') || '10'),
  });

  const getInitialSorting = (): SortingState => {
    const sortParam = searchParams.get('sort');
    if (!sortParam) return [];
    
    const [field, direction] = sortParam.split('.');
    return [{ id: field, desc: direction === 'desc' }];
  };

  const getInitialSearch = (): string => {
    return searchParams.get('search') || '';
  };

  const getInitialStatuses = (): string[] => {
    const param = searchParams.get('statuses');
    if (!param) return ['active', 'inactive']; // default visible
    return param.split(',').filter((s) => HOUSE_STATUS_OPTIONS.some(opt => opt.value === s));
  };

  // Initialize state from URL params
  const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting());
  const [searchQuery, setSearchQuery] = useState(getInitialSearch());
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(getInitialStatuses());

  const filters = useMemo(() => ({
    search: searchQuery,
    statuses: selectedStatuses
  }), [searchQuery, selectedStatuses]);

  const { houses, count, loading, error, updateHouse } = useHouses(
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    filters
  );

  const { participants } = useParticipants(); // Fetch all participants (still needed for nested data)
  const { houseStaffAssignments } = useHouseStaffAssignments(); // Fetch all house staff assignments (still needed for nested data)

  // Sync state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    
    // Pagination - only add if not default
    if (pagination.pageIndex > 0) {
      params.set('page', (pagination.pageIndex + 1).toString()); // Convert to 1-indexed
    }
    if (pagination.pageSize !== 10) {
      params.set('pageSize', pagination.pageSize.toString());
    }
    
    // Sorting
    if (sorting.length > 0) {
      const sort = sorting[0];
      params.set('sort', `${sort.id}.${sort.desc ? 'desc' : 'asc'}`);
    }
    
    // Search
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    // Always update the URL with the current list
    params.set('statuses', selectedStatuses.join(','));

    // Update URL without adding to history
    setSearchParams(params, { replace: true });
  }, [pagination, sorting, searchQuery, selectedStatuses, setSearchParams]);

  // Table columns
  const columns: ColumnDef<House>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="House Name"
            tooltip="House name and location"
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <HouseIcon className="size-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {row.getValue('name') || 'Unnamed House'}
              </span>
              {row.original.address && (
                <a
                  href={createGoogleMapsUrl(row.original.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <MapPin className="size-3" />
                  <span className="truncate max-w-[200px]">{row.original.address}</span>
                </a>
              )}
            </div>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-40" />
              </div>
            </div>
          ),
        },
        size: 250,
      },
      {
        id: 'occupancy',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Occupancy"
            tooltip="Current occupancy vs capacity"
          />
        ),
        cell: ({ row }) => {
          const participantsForHouse = getHouseParticipants(row.original.id, participants);
          const currentOccupancy = participantsForHouse.length;
          const capacity = row.original.capacity || 0;
          
          // Handle divide by zero
          const percentage = capacity > 0 ? (currentOccupancy / capacity) * 100 : 0;
          const occupancyText = capacity > 0 ? `${currentOccupancy}/${capacity}` : `${currentOccupancy}/0`;
          
          return (
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {occupancyText}
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="flex-1 h-2" 
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[35px]">
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-2 w-full" />
            </div>
          ),
        },
        size: 150,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Status"
            tooltip="Current house status"
          />
        ),
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          const variantMap: Record<string, string> = {
            active: 'success',
            inactive: 'secondary',
            maintenance: 'warning',
          };
          const labelMap: Record<string, string> = {
            active: 'Active',
            inactive: 'Inactive',
            maintenance: 'Maintenance',
          };
          return (
            <Badge
              variant={variantMap[status] as any || 'secondary'}
              appearance="light"
              size="sm"
            >
              {labelMap[status] || status}
            </Badge>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
        },
        size: 100,
      },
      {
        id: 'linked_staff',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Linked Staff"
            tooltip="Number of active staff assigned to this house"
          />
        ),
        cell: ({ row }) => {
          const staffCount = getHouseStaffCount(row.original.id, houseStaffAssignments);
          return (
            <div className="text-sm text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {staffCount}
                  </span>
                </div>
                <span className="text-sm">
                  {staffCount === 1 ? 'staff member' : 'staff members'}
                </span>
              </div>
            </div>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-6 w-24 rounded-full" />,
        },
        size: 120,
      },
      {
        id: 'participants',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Participants"
            tooltip="Active participants linked to this house"
          />
        ),
        cell: ({ row }) => {
          const participantsForHouse = getHouseParticipants(row.original.id, participants);
          return (
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {participantsForHouse.length > 0 ? (
                <div className="space-y-1">
                  {participantsForHouse.map((name, index) => (
                    <div key={index} className="text-xs">
                      {name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">No participants</div>
              )}
            </div>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-3 w-32" />,
        },
        size: 200,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionsCell row={row} updateHouse={updateHouse} />,
        meta: {
          skeleton: <Skeleton className="h-8 w-20" />,
        },
        enableSorting: false,
        size: 150,
      },
    ],
    [updateHouse, participants, houseStaffAssignments]
  );

  const pageCount = useMemo(() => {
    return Math.ceil(count / pagination.pageSize);
  }, [count, pagination.pageSize]);

  const table = useReactTable({
    columns,
    data: houses,
    pageCount,
    getRowId: (row: House) => row.id,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // If pageSize changed, reset pageIndex to 0
        if (next.pageSize !== prev.pageSize) {
          return { ...next, pageIndex: 0 };
        }
        return next;
      });
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertIcon />
        <AlertTitle>Error loading houses</AlertTitle>
        <p className="text-sm">{error}</p>
      </Alert>
    );
  }

  return (
    <DataGrid
      table={table}
      recordCount={count}
      isLoading={loading}
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
                placeholder="Search Houses..."
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
            <StatusFilter
              value={selectedStatuses}
              onChange={setSelectedStatuses}
              options={HOUSE_STATUS_OPTIONS}
              label="Status"
            />
          </div>
        </CardHeader>

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
}

