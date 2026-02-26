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
  Edit,
  Search,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

import { Staff, useStaff } from '@/hooks/useStaff';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';
import { useDebouncedSearchParams } from '@/hooks/use-debounced-search-params';

const STAFF_STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active', badge: 'success' },
  { value: 'draft', label: 'Draft', badge: 'warning' },
  { value: 'inactive', label: 'Inactive', badge: 'secondary' },
];

function ActionsCell({ row }: { row: Row<Staff> }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/employees/staff-detail/${row.original.id}`);
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
    </div>
  );
}

const StaffTable = () => {
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
    if (!param) return ['active', 'draft']; // default visible
    return param.split(',').filter((s) => STAFF_STATUS_OPTIONS.some(opt => opt.value === s));
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

  const { staff, count, loading, error, updateStaff } = useStaff(
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    filters
  );

  const columns: ColumnDef<Staff>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => (
        <DataGridColumnHeader title="Name" column={column} />
      ),
      cell: ({ row }) => {
        const name = row.original.name;
        const initials = name
          ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
          : '??';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              {row.original.photo_url && (
                <AvatarImage src={row.original.photo_url} alt={name ?? ''} />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {name || '-'}
            </span>
          </div>
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
      id: 'email',
      accessorKey: 'email',
      header: ({ column }) => (
        <DataGridColumnHeader title="Email / Phone" column={column} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.email || '-'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {row.original.phone || '-'}
          </span>
        </div>
      ),
      meta: {
        skeleton: (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ),
      },
      enableSorting: true,
      size: 230,
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: ({ column }) => (
        <DataGridColumnHeader title="Department" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.department_info?.name || '-'}
        </span>
      ),
      meta: {
        skeleton: <Skeleton className="h-3 w-20" />,
      },
      enableSorting: true,
      size: 120,
    },
    {
      id: 'employment_type',
      accessorKey: 'employment_type',
      header: ({ column }) => (
        <DataGridColumnHeader title="Employment Type" column={column} />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.employment_type_info?.name || 'Not Specified'}
        </Badge>
      ),
      meta: {
        skeleton: <Skeleton className="h-5 w-24 rounded-full" />,
      },
      size: 130,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => (
        <DataGridColumnHeader title="Status" column={column} />
      ),
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} />
      ),
      meta: {
        skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
      },
      size: 80,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ActionsCell,
      meta: {
        skeleton: <Skeleton className="h-8 w-20" />,
      },
      size: 100,
    },
  ];

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
      }}
    >
      <Card>
        <CardHeader>
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
            <CardToolbar>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Additional toolbar items here if needed */}
              </div>
            </CardToolbar>
          </div>
        </CardHeader>

        {loading && <div className="p-4 text-center">Loading staff...</div>}
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

export { StaffTable };
