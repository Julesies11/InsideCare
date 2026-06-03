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
  X,
} from 'lucide-react';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { StatusFilter, StatusOption } from '@/components/ui/status-filter';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataGridTable,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { Staff, useStaff } from '@/hooks/use-staff';
import { useRoles } from '@/hooks/use-roles';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useDebounce } from '@/hooks/use-debounce';
import { ROUTES } from '@/config/routes.config';

import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';

const STAFF_STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active', badge: 'success' },
  { value: 'draft', label: 'Draft', badge: 'warning' },
  { value: 'inactive', label: 'Inactive', badge: 'secondary' },
];

const StaffTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasAccess } = useRBAC();
  const { roles: allRoles } = useRoles();
  
  const canManageAny = hasAccess({ 
    resource: RBAC_MODULES.EMPLOYEES, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  // Helper functions to parse URL params into initial state
  const getInitialPagination = (): PaginationState => ({
    pageIndex: Math.max(0, parseInt(searchParams.get('page') || '1') - 1), // Convert to 0-indexed
    pageSize: parseInt(searchParams.get('pageSize') || '25'),
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
    if (!param) return ['active', 'draft']; // default visible
    return param.split(',').filter((s) => STAFF_STATUS_OPTIONS.some(opt => opt.value === s));
  };

  const getInitialRoles = (): string[] => {
    const param = searchParams.get('roles');
    return param ? param.split(',') : [];
  };

  // Initialize state from URL params
  const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting());
  const [searchQuery, setSearchQuery] = useState(getInitialSearch());
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(getInitialStatuses());
  const [selectedRoles, setSelectedRoles] = useState<string[]>(getInitialRoles());

  // Use debounced search query for API calls to reduce server load
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filters = useMemo(() => ({
    search: debouncedSearchQuery,
    statuses: selectedStatuses,
    roleIds: selectedRoles
  }), [debouncedSearchQuery, selectedStatuses, selectedRoles]);

  const { data, isLoading: loading, error } = useStaff(
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    filters
  );
  const staff = data?.data || [];
  const count = data?.count || 0;

  console.log('[DEBUG] Staff rendering:', { staffCount: staff.length, count, loading, error, filters });

  const roleOptions: StatusOption[] = useMemo(() => 
    allRoles.map(r => ({ value: r.id, label: r.role_name })), 
    [allRoles]
  );

  const columns: ColumnDef<Staff>[] = useMemo(() => [
    {
      id: 'name',
      accessorKey: 'staff_name',
      header: ({ column }) => (
        <DataGridColumnHeader title="Staff Member" column={column} />
      ),
      cell: ({ row }) => {
        const name = row.original.staff_name;
        const initials = name
          ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
          : '??';

        const detailUrl = `${ROUTES.STAFF_DETAIL}/${row.original.id}`;

        return (
          <Link 
            to={detailUrl}
            className="flex items-center gap-2.5 group w-full max-w-full text-left"
          >
            <SecureAvatar 
              src={row.original.photo_url} 
              initials={initials} 
              className="size-9 group-hover:ring-2 group-hover:ring-primary/20 transition-all shrink-0"
              bucket={STORAGE_BUCKETS.STAFF_PHOTOS} 
            />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover:underline transition-colors break-words whitespace-normal">
              {name || '-'}
            </span>
          </Link>
        );
      },
      meta: {
        skeleton: (
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ),
      },
      enableSorting: true,
      size: 200,
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: ({ column }) => (
        <DataGridColumnHeader title="Role" column={column} />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-normal text-left">
          {row.original.role?.role_name || '-'}
        </div>
      ),
      enableSorting: true,
      size: 150,
    },
    {
      id: 'contact',
      accessorKey: 'email',
      header: ({ column }) => (
        <DataGridColumnHeader title="Contact" column={column} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col text-left break-words whitespace-normal">
          <span className="text-sm text-gray-700 dark:text-gray-300 select-all">
            {row.original.email || '-'}
          </span>
          {row.original.phone && (
            <span className="text-xs text-muted-foreground select-all">
              {row.original.phone}
            </span>
          )}
        </div>
      ),
      enableSorting: true,
      size: 250,
    },
    {
      id: 'houses',
      header: ({ column }) => (
        <DataGridColumnHeader title="House" column={column} />
      ),
      cell: ({ row }) => {
        const assignments = row.original.house_assignments || [];
        if (assignments.length === 0) return <span className="text-sm text-gray-500">-</span>;
        
        return (
          <div className="flex flex-col gap-1 text-left break-words whitespace-normal">
            {assignments.map((assignment) => (
              assignment.house ? (
                <Link 
                  key={assignment.id} 
                  to={`${ROUTES.HOUSE_DETAIL}/${assignment.house_id}`}
                  className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                >
                  {assignment.house.house_name}
                </Link>
              ) : (
                <span key={assignment.id} className="text-sm text-gray-500">Unknown House</span>
              )
            ))}
          </div>
        );
      },
      meta: {
        skeleton: (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ),
      },
      enableSorting: false, // House is a join list, harder to sort server-side without custom logic
      size: 180,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => (
        <DataGridColumnHeader title="Status" column={column} />
      ),
      cell: ({ row }) => (
        <div className="break-words whitespace-normal">
          <StatusBadge status={row.original.status} />
        </div>
      ),
      meta: {
        skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
      },
      enableSorting: true,
      size: 80,
    },
  ], []);

  // Sync state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    // Pagination - update URL as soon as page changes
    if (pagination.pageIndex > 0) {
      params.set('page', (pagination.pageIndex + 1).toString()); // Convert to 1-indexed
    } else {
      params.delete('page');
    }

    if (pagination.pageSize !== 25) {
      params.set('pageSize', pagination.pageSize.toString());
    } else {
      params.delete('pageSize');
    }
    
    // Sorting
    if (sorting.length > 0) {
      const sort = sorting[0];
      params.set('sort', `${sort.id}.${sort.desc ? 'desc' : 'asc'}`);
    } else {
      params.delete('sort');
    }
    
    // Search - sync raw query to URL immediately for responsiveness
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    
    // Always update the URL with the current statuses
    if (selectedStatuses.length > 0) {
      params.set('statuses', selectedStatuses.join(','));
    } else {
      params.delete('statuses');
    }

    // Role filter
    if (selectedRoles.length > 0) {
      params.set('roles', selectedRoles.join(','));
    } else {
      params.delete('roles');
    }

    // Update URL immediately without adding to history to ensure state is preserved if user navigates away
    setSearchParams(params, { replace: true });
  }, [pagination, sorting, searchQuery, selectedStatuses, selectedRoles, setSearchParams]);

  const pageCount = useMemo(() => {
    return Math.ceil(count / pagination.pageSize);
  }, [count, pagination.pageSize]);

  const table = useReactTable({
    data: staff,
    columns,
    state: {
      pagination,
      sorting,
    },
    initialState: {
      columnPinning: {
        left: ['name'],
      },
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
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
        width: 'fixed'
      }}
    >
      <Card>
        <CardHeader className="flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search staff..."
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
              options={STAFF_STATUS_OPTIONS}
              label="Status"
            />
            <StatusFilter
              value={selectedRoles}
              onChange={setSelectedRoles}
              options={roleOptions}
              label="Role"
            />
            {!canManageAny && (
              <Badge variant="warning" appearance="light" size="sm" className="h-9 px-3">
                Read Only
              </Badge>
            )}
          </div>
          <CardToolbar>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Additional toolbar items here if needed */}
            </div>
          </CardToolbar>
        </CardHeader>

        {loading && <div className="p-4 text-center">Loading staff...</div>}
        {error && (
          <Alert variant="destructive" className="m-4">
            {error}
          </Alert>
        )}

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
};

export { StaffTable };
