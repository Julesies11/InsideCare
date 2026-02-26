'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useDebouncedSearchParams } from '@/hooks/use-debounced-search-params';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { StatusFilter, StatusOption } from '@/components/ui/status-filter';
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
import { Skeleton } from '@/components/ui/skeleton';
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

import { Participant, ParticipantWithHouse }  from '@/models/participant';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Archive, Edit, Eye } from 'lucide-react';
import { useParticipants } from '@/hooks/use-participants';
import { useHouses } from '@/hooks/use-houses';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/auth/context/auth-context';
import { parseSupabaseError } from '@/lib/error-parser';

const PARTICIPANT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active', badge: 'success' },
  { value: 'draft', label: 'Draft', badge: 'warning' },
  { value: 'inactive', label: 'Inactive', badge: 'secondary' },
];

function ActionsCell({ row, updateParticipant }: { row: Row<ParticipantWithHouse>; updateParticipant: (id: string, updates: Partial<Participant>) => Promise<{ data: any; error: string | null }> }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleView = () => {
    navigate(`/participants/detail/${row.original.id}`);
  };

  const handleEdit = () => {
    navigate(`/participants/detail/${row.original.id}/edit`);
  };

  const handleArchive = async () => {
    try {
      const { error } = await updateParticipant(row.original.id, { status: 'inactive' });

      if (error) {
        const parsedError = parseSupabaseError(error);
        toast.error(parsedError.title, { description: parsedError.description });
        throw new Error(parsedError.description);
      }

      // Log activity
      await logActivity({
        activityType: 'update',
        entityType: 'participant',
        entityId: row.original.id,
        entityName: row.original.name,
        userName: user?.email || 'Unknown user',
        customDescription: 'Participant archived (set to inactive)',
      });

      toast.success('Participant archived successfully');
    } catch (error) {
      console.error('Error archiving participant:', error);
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

// Helper function to get initials from name
function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const Participants = () => {
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

  const getInitialHouses = (): string[] => {
    const housesParam = searchParams.get('houses');
    return housesParam ? housesParam.split(',') : [];
  };

  const getInitialStatuses = (): string[] => {
    const param = searchParams.get('statuses');
    if (!param) return ['active', 'draft']; // default visible
    return param.split(',').filter((s) => PARTICIPANT_STATUS_OPTIONS.some(opt => opt.value === s));
  };

  // Initialize state from URL params
  const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting());
  const [searchQuery, setSearchQuery] = useState(getInitialSearch());
  const [selectedHouses, setSelectedHouses] = useState<string[]>(getInitialHouses());
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(getInitialStatuses());

  const filters = useMemo(() => ({
    search: searchQuery,
    houses: selectedHouses,
    statuses: selectedStatuses
  }), [searchQuery, selectedHouses, selectedStatuses]);

  const { participants, loading, error, count, updateParticipant } = useParticipants(
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    filters
  );
  
  const { houses } = useHouses();

  // Count of participants per house (This still uses the full list if we want accurate badges, 
  // but for now we'll simplify or keep it as is if useHouses has the counts)
  const houseCounts = useMemo(() => {
    // Note: This logic only counts from the CURRENT PAGE now. 
    // For a production app, the house counts should ideally come from a separate count query or summary.
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
    
    // House filters
    if (selectedHouses.length > 0) {
      params.set('houses', selectedHouses.join(','));
    }
    
    // Status filters - always update the URL with the current list
    params.set('statuses', selectedStatuses.join(','));
    
    // Update URL without adding to history
    setSearchParams(params, { replace: true });
  }, [pagination, sorting, searchQuery, selectedHouses, selectedStatuses, setSearchParams]);

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
        meta: {
          skeleton: (
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ),
        },
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
        meta: {
          skeleton: <Skeleton className="h-3 w-20" />,
        },
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
        meta: {
          skeleton: <Skeleton className="h-3 w-24" />,
        },
        enableSorting: true,
        size: 165,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} />
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
        },
        enableSorting: true,
        size: 165,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionsCell row={row} updateParticipant={updateParticipant} />,
        meta: {
          skeleton: <Skeleton className="h-8 w-20" />,
        },
        enableSorting: false,
        size: 150,
      },
    ],
    [updateParticipant]
  );

  const pageCount = useMemo(() => {
    return Math.ceil(count / pagination.pageSize);
  }, [count, pagination.pageSize]);

  const table = useReactTable({
    columns,
    data: participants,
    pageCount,
    getRowId: (row: ParticipantWithHouse) => row.id,
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
            <StatusFilter
              value={selectedStatuses}
              onChange={setSelectedStatuses}
              options={PARTICIPANT_STATUS_OPTIONS}
              label="Status"
            />
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
