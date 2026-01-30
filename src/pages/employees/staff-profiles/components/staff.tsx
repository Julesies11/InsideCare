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
  X,
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { Staff, useStaff } from '@/hooks/useStaff';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';

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
  const { staff, loading, error } = useStaff();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Filtered data based on search and active status
  const filteredData = useMemo(() => {
    return staff.filter((item) => {
      // Active status filter
      if (showActiveOnly && !item.is_active) {
        return false;
      }

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.email && item.email.toLowerCase().includes(searchLower)) ||
        (item.department && item.department.toLowerCase().includes(searchLower));

      return matchesSearch;
    });
  }, [staff, searchQuery, showActiveOnly]);

  const columns: ColumnDef<Staff>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => (
        <DataGridColumnHeader title="Name" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.original.name}
        </span>
      ),
      enableSorting: true,
      size: 200,
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: ({ column }) => (
        <DataGridColumnHeader title="Email" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.email || '-'}
        </span>
      ),
      enableSorting: true,
      size: 220,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataGridColumnHeader title="Phone" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.phone || '-'}
        </span>
      ),
      size: 150,
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: ({ column }) => (
        <DataGridColumnHeader title="Department" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.department || '-'}
        </span>
      ),
      enableSorting: true,
      size: 150,
    },
    {
      id: 'employment_type',
      accessorKey: 'employment_type',
      header: ({ column }) => (
        <DataGridColumnHeader title="Employment Type" column={column} />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.employment_type || 'Not Specified'}
        </Badge>
      ),
      size: 150,
    },
    {
      id: 'hire_date',
      accessorKey: 'hire_date',
      header: ({ column }) => (
        <DataGridColumnHeader title="Hire Date" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {row.original.hire_date
            ? format(new Date(row.original.hire_date), 'dd MMM yyyy')
            : '-'}
        </span>
      ),
      enableSorting: true,
      size: 130,
    },
    {
      id: 'status',
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataGridColumnHeader title="Status" column={column} />
      ),
      cell: ({ row }) => (
        <Badge
          variant={row.original.is_active ? 'success' : 'secondary'}
          className="text-xs"
        >
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
      size: 100,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ActionsCell,
      size: 150,
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="size-4" />
                  Status
                  {!showActiveOnly && (
                    <Badge size="sm" variant="outline">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    Filter by Status
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="active"
                        checked={showActiveOnly}
                        onCheckedChange={(checked) =>
                          setShowActiveOnly(checked === true)
                        }
                      />
                      <Label
                        htmlFor="active"
                        className="font-normal cursor-pointer"
                      >
                        Active Only
                      </Label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
