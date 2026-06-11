'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { House } from '@/models/house';
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
import { House as HouseIcon, MapPin, Search, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { parseSupabaseError } from '@/lib/error-parser';
import { useDebounce } from '@/hooks/use-debounce';
import { useHouses, useUpdateHouse } from '@/hooks/use-houses';
import { useParticipants } from '@/hooks/use-participants';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusFilter, StatusOption } from '@/components/ui/status-filter';

const HOUSE_STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active', badge: 'success' },
  { value: 'inactive', label: 'Inactive', badge: 'secondary' },
  { value: 'maintenance', label: 'Maintenance', badge: 'warning' },
];

// Helper function to get participants for a house
function getHouseParticipants(
  houseId: string,
  allParticipants: Array<{
    id: string;
    participant_name: string;
    house_id?: string;
    status: string;
    photo_url?: string;
  }>,
) {
  return allParticipants
    .filter(
      (participant) =>
        participant.house_id === houseId && participant.status === 'active',
    )
    .map((participant) => ({
      id: participant.id,
      name: participant.participant_name,
      photo_url: participant.photo_url,
    }))
    .filter((p) => p.name);
}

// Helper function to create Google Maps URL from address
function createGoogleMapsUrl(address: string) {
  if (!address) return '#';
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

export function Houses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { mutateAsync: updateHouseMutation } = useUpdateHouse();

  const canManageGlobal = hasAccess({
    resource: RBAC_MODULES.HOUSES,
    requiredLevel: ACCESS_LEVEL.FULL,
  });
  const canManageAny = hasAccess({
    resource: RBAC_MODULES.HOUSES,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  // Helper functions to parse URL params
  const page = useMemo(
    () => Math.max(1, parseInt(searchParams.get('page') || '1')),
    [searchParams],
  );
  const pageSize = useMemo(
    () => parseInt(searchParams.get('pageSize') || '25'),
    [searchParams],
  );
  const sortParam = useMemo(
    () => searchParams.get('sort') || '',
    [searchParams],
  );
  const searchParam = useMemo(
    () => searchParams.get('search') || '',
    [searchParams],
  );
  const statusParam = useMemo(
    () => searchParams.get('statuses') || 'active',
    [searchParams],
  );

  // Derived states for TanStack Table
  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: pageSize,
    }),
    [page, pageSize],
  );

  const sorting = useMemo((): SortingState => {
    if (!sortParam) return [];
    const [field, direction] = sortParam.split('.');
    return [{ id: field, desc: direction === 'desc' }];
  }, [sortParam]);

  const selectedStatuses = useMemo(
    () =>
      statusParam
        .split(',')
        .filter((s) => HOUSE_STATUS_OPTIONS.some((opt) => opt.value === s)),
    [statusParam],
  );

  // Search query state (local for immediate input feedback)
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sync debounced search query back to URL
  useEffect(() => {
    if (debouncedSearchQuery !== searchParam) {
      const params = new URLSearchParams(searchParams);
      if (debouncedSearchQuery) {
        params.set('search', debouncedSearchQuery);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to page 1 on search
      setSearchParams(params, { replace: true });
    }
  }, [debouncedSearchQuery, searchParam, setSearchParams, searchParams]);

  // Sync search query state if URL changes externally (e.g. back button)
  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);

  const filters = useMemo(
    () => ({
      search: debouncedSearchQuery,
      statuses: selectedStatuses,
    }),
    [debouncedSearchQuery, selectedStatuses],
  );

  const {
    houses,
    count,
    isLoading: loading,
    error,
  } = useHouses(pagination.pageIndex, pagination.pageSize, sorting, filters);

  const { participants: allParticipants } = useParticipants(0, 1000); // Fetch more for occupancy calculation
  const participants = useMemo(() => allParticipants || [], [allParticipants]);

  console.log('[DEBUG] Houses rendering:', {
    housesCount: houses?.length,
    participantsCount: participants?.length,
    loading,
    error,
  });

  // Handle pagination change
  const handlePaginationChange = (updater: any) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    const params = new URLSearchParams(searchParams);

    if (next.pageIndex > 0) {
      params.set('page', (next.pageIndex + 1).toString());
    } else {
      params.delete('page');
    }

    if (next.pageSize !== 10) {
      params.set('pageSize', next.pageSize.toString());
    } else {
      params.delete('pageSize');
    }

    setSearchParams(params, { replace: true });
  };

  // Handle sorting change
  const handleSortingChange = (updater: any) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    const params = new URLSearchParams(searchParams);

    if (next.length > 0) {
      const sort = next[0];
      params.set('sort', `${sort.id}.${sort.desc ? 'desc' : 'asc'}`);
    } else {
      params.delete('sort');
    }

    setSearchParams(params, { replace: true });
  };

  // Handle status filter change
  const handleStatusChange = (statuses: string[]) => {
    const params = new URLSearchParams(searchParams);
    if (statuses.length > 0) {
      params.set('statuses', statuses.join(','));
    } else {
      params.delete('statuses');
    }
    params.set('page', '1'); // Reset to page 1
    setSearchParams(params, { replace: true });
  };

  // Table columns
  const columns: ColumnDef<House>[] = useMemo(
    () => [
      {
        accessorKey: 'house_name',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="House Name"
            tooltip="House name and location"
          />
        ),
        cell: ({ row }) => {
          const detailUrl = `${ROUTES.HOUSE_DETAIL}/${row.original.id}`;
          return (
            <Link
              to={detailUrl}
              className="flex items-center gap-3 group w-full max-w-full text-left"
            >
              <div className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:ring-2 group-hover:ring-primary/20 transition-all shrink-0">
                <HouseIcon className="size-4 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover:underline transition-colors break-words whitespace-normal">
                {row.getValue('house_name') || 'Unnamed House'}
              </span>
            </Link>
          );
        },
        meta: {
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ),
        },
        enableSorting: true,
        size: 220,
      },
      {
        id: 'contact',
        accessorKey: 'address',
        header: ({ column }) => (
          <DataGridColumnHeader title="Contact" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col text-left break-words whitespace-normal">
            {row.original.address ? (
              <span className="text-sm text-gray-700 dark:text-gray-300 select-all">
                {row.original.address}
              </span>
            ) : (
              <span className="text-sm text-gray-500">-</span>
            )}
            {row.original.phone && (
              <span className="text-xs text-muted-foreground select-all mt-0.5">
                {row.original.phone}
              </span>
            )}
          </div>
        ),
        enableSorting: true,
        size: 250,
      },
      {
        id: 'linked_staff',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Linked Staff"
            tooltip="Active staff members assigned to this house"
          />
        ),
        cell: ({ row }) => {
          const assignments = (row.original as any).staff_assignments || [];
          const activeAssignments = assignments.filter(
            (a: any) =>
              a.staff &&
              a.staff.status === 'active' &&
              (!a.end_date || new Date(a.end_date) >= new Date()),
          );

          if (activeAssignments.length === 0)
            return (
              <span className="text-xs text-gray-500">No active staff</span>
            );

          return (
            <div className="flex flex-col gap-1.5 break-words whitespace-normal text-left">
              {activeAssignments.map((assignment: any) => {
                const staff = assignment.staff;
                if (!staff) return null;
                const initials = staff.staff_name
                  ? staff.staff_name
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : '??';

                return (
                  <Link
                    key={assignment.id}
                    to={`${ROUTES.STAFF_DETAIL}/${staff.id}`}
                    className="flex items-center gap-2 group/staff w-fit"
                  >
                    <SecureAvatar
                      src={staff.photo_url}
                      initials={initials}
                      className="size-6 transition-all group-hover/staff:ring-2 group-hover/staff:ring-primary/20"
                      bucket={STORAGE_BUCKETS.STAFF_PHOTOS}
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover/staff:text-primary transition-colors truncate max-w-[120px]">
                      {staff.staff_name}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-2 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
          ),
        },
        enableSorting: true,
        size: 200,
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
          const participantsForHouse = getHouseParticipants(
            row.original.id,
            participants,
          );
          if (participantsForHouse.length === 0)
            return (
              <span className="text-xs text-gray-500">No participants</span>
            );

          return (
            <div className="flex flex-col gap-1.5 break-words whitespace-normal text-left">
              {participantsForHouse.map((p) => {
                const initials = p.name
                  ? p.name
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : '??';

                return (
                  <Link
                    key={p.id}
                    to={`${ROUTES.PARTICIPANT_DETAIL}/${p.id}`}
                    className="flex items-center gap-2 group/participant w-fit"
                  >
                    <SecureAvatar
                      src={p.photo_url}
                      initials={initials}
                      className="size-6 transition-all group-hover/participant:ring-2 group-hover/participant:ring-primary/20"
                      bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover/participant:text-primary transition-colors truncate max-w-[120px]">
                      {p.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-3 w-32" />,
        },
        enableSorting: true,
        size: 200,
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
            <div className="break-words whitespace-normal">
              <Badge
                variant={(variantMap[status] as any) || 'secondary'}
                appearance="light"
                size="sm"
              >
                {labelMap[status] || status}
              </Badge>
            </div>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
        },
        enableSorting: true,
        size: 100,
      },
      {
        id: 'occupancy',
        accessorKey: 'current_occupancy',
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title="Occupancy"
            tooltip="Current occupancy vs house ratio"
          />
        ),
        cell: ({ row }) => {
          const participantsForHouse = getHouseParticipants(
            row.original.id,
            participants,
          );
          const currentOccupancy = participantsForHouse.length;
          const capacity = row.original.capacity || 0;

          // Handle divide by zero
          const percentage =
            capacity > 0 ? (currentOccupancy / capacity) * 100 : 0;
          const occupancyText =
            capacity > 0
              ? `${currentOccupancy}/${capacity}`
              : `${currentOccupancy}/0`;

          return (
            <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
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
        enableSorting: true,
        size: 150,
      },
    ],
    [participants],
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
    initialState: {
      columnPinning: {
        left: ['house_name'],
      },
    },
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
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
        width: 'fixed',
      }}
    >
      <Card id="houses_table">
        <CardHeader className="flex-wrap gap-2.5">
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
              onChange={handleStatusChange}
              options={HOUSE_STATUS_OPTIONS}
              label="Status"
            />
            {!canManageAny && (
              <Badge
                variant="warning"
                appearance="light"
                size="sm"
                className="h-9 px-3"
              >
                Read Only
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardTable className="overflow-hidden">
          <ScrollArea className="w-full">
            <DataGridTable />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
