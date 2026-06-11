import { useState } from 'react';
import { OnboardingMonitoringItem } from '@/api/onboarding.api';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Search,
} from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { useDebounce } from '@/hooks/use-debounce';
import { useOnboardingMonitoring } from '@/hooks/use-staff';
import { useTableUrlState } from '@/hooks/use-table-url-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { Container } from '@/components/common/container';

export function OnboardingMonitoringPage() {
  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    setSelectedStatuses,
  } = useTableUrlState({
    defaultSort: [{ id: 'staff_name', desc: false }],
    defaultStatuses: ['Pending'],
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  const {
    data: items = [],
    totalCount = 0,
    isLoading,
    error,
  } = useOnboardingMonitoring({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    searchTerm: debouncedSearch,
    statusFilter: selectedStatuses,
    staffStatuses: ['active'],
    sortBy: sorting[0]?.id || 'staff_name',
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
  });

  const columns: ColumnDef<OnboardingMonitoringItem>[] = [
    {
      accessorKey: 'staff_name',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Staff Member" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            <SecureAvatar
              src={item.photo_url}
              name={item.staff_name}
              size="sm"
              className="size-9 rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">
                {item.staff_name}
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {item.assigned_houses.slice(0, 2).map((house, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-3.5 bg-slate-50 text-slate-500 font-medium border-slate-200"
                  >
                    {house}
                  </Badge>
                ))}
                {item.assigned_houses.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{item.assigned_houses.length - 2} more
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'item_name',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Onboarding Task" />
      ),
      size: 300,
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">
          {row.original.item_name}
        </span>
      ),
    },
    {
      accessorKey: 'is_complete',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isComplete = row.original.is_complete;
        return isComplete ? (
          <Badge
            variant="success"
            className="gap-1.5 px-3 py-1 text-[11px] font-bold min-w-[100px] justify-center"
          >
            <CheckCircle2 className="size-3.5" />
            Complete
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1 text-[11px] font-bold min-w-[100px] justify-center bg-amber-50 text-amber-700 border-amber-200"
          >
            <Clock className="size-3.5" />
            Pending
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right pr-4">Action</div>,
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Link
            to={`${ROUTES.STAFF_DETAIL}/${row.original.staff_id}#staff_onboarding`}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            >
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <Container>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ClipboardCheck className="size-6 text-gray-600 dark:text-gray-400" />
              Onboarding Monitoring
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor individual staff setup checklists and orientation
              progress across the organization.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.REPORT_ONBOARDING || '#'}>
              <Button variant="outline" size="sm">
                <FileText className="size-4 mr-2" />
                Onboarding Audit Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <Input
              placeholder="Search by staff name or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10.5 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest sm:whitespace-nowrap">
              Task Status:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Pending', 'Complete'].map((s) => {
                const isSelected = selectedStatuses.includes(s);
                return (
                  <Badge
                    key={s}
                    variant={isSelected ? 'primary' : 'outline'}
                    className={`cursor-pointer h-9 px-4 text-[11px] font-bold min-w-[100px] justify-center transition-all border-2 ${
                      isSelected
                        ? 'shadow-xs border-primary/10'
                        : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedStatuses(
                          selectedStatuses.filter((v) => v !== s),
                        );
                      } else {
                        setSelectedStatuses([...selectedStatuses, s]);
                      }
                    }}
                  >
                    {s}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        {/* DataGrid */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Onboarding Checklist Directory
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="p-12 text-center">
                <AlertTriangle className="size-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-700">
                  Audit Data Unavailable
                </h3>
                <p className="text-sm text-red-500 max-w-md mx-auto mt-2">
                  {(error as any).message ||
                    'An unexpected error occurred while fetching onboarding records.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <DataGrid
                table={table}
                recordCount={totalCount}
                isLoading={isLoading}
              >
                <DataGridTable />
                <DataGridPagination />
              </DataGrid>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
