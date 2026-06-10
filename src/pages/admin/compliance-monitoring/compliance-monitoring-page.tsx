import { useState } from 'react';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  Clock, 
  ClipboardCheck,
  FileText
} from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { useComplianceMonitoring } from '@/hooks/use-staff';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { useTableUrlState } from '@/hooks/use-table-url-state';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ColumnDef, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { ComplianceMonitoringItem } from '@/api/compliance.api';
import { format } from 'date-fns';

export function ComplianceMonitoringPage() {
  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    setSelectedStatuses
  } = useTableUrlState({
    defaultSort: [{ id: 'staff_name', desc: false }],
    defaultStatuses: ['Missing', 'Expired', 'Expiring Soon', 'In Progress']
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: requirements = [], totalCount = 0, isLoading, error } = useComplianceMonitoring({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    searchTerm: debouncedSearch,
    statusFilter: selectedStatuses,
    staffStatuses: ['active'],
    sortBy: sorting[0]?.id || 'staff_name',
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc'
  });

  const columns: ColumnDef<ComplianceMonitoringItem>[] = [
    {
      accessorKey: 'staff_name',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Staff Member" />,
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
              <span className="font-semibold text-gray-900">{item.staff_name}</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {item.assigned_houses.slice(0, 2).map((house, idx) => (
                  <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-slate-50 text-slate-500 font-medium border-slate-200">
                    {house}
                  </Badge>
                ))}
                {item.assigned_houses.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">+{item.assigned_houses.length - 2} more</span>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'compliance_name',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Requirement" />,
      size: 250,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700">{row.original.compliance_name}</span>
          {row.original.document_number && (
            <span className="text-[10px] text-muted-foreground">Ref: {row.original.document_number}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'expiry_date',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Expiry Date" />,
      cell: ({ row }) => {
        const date = row.original.expiry_date;
        if (!date) return <span className="text-slate-400 text-xs">-</span>;
        return <span className="text-sm font-medium text-slate-600">{format(new Date(date), 'dd MMM yyyy')}</span>;
      }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        switch (status) {
          case 'Complete':
            return (
              <Badge variant="success" className="gap-1.5 px-3 py-1 text-[11px] font-bold min-w-[100px] justify-center">
                <CheckCircle2 className="size-3.5" />
                Compliant
              </Badge>
            );
          case 'Expiring Soon':
            return (
              <Badge variant="warning" className="gap-1.5 px-3 py-1 text-[11px] font-bold min-w-[100px] justify-center">
                <Clock className="size-3.5" />
                Expiring
              </Badge>
            );
          case 'Expired':
            return (
              <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-[11px] font-bold min-w-[100px] justify-center">
                <AlertTriangle className="size-3.5" />
                Expired
              </Badge>
            );
          case 'In Progress':
            return (
              <Badge variant="primary" className="gap-1.5 px-3 py-1 text-[11px] font-bold min-w-[100px] justify-center bg-blue-50 text-blue-700 border-blue-200">
                In Progress
              </Badge>
            );
          case 'Missing':
            return (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-[11px] font-bold min-w-[100px] justify-center bg-slate-100 text-slate-600 border-slate-200">
                Missing
              </Badge>
            );
          default:
            return <Badge variant="outline" className="px-3 py-1 text-[11px]">{status}</Badge>;
        }
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right pr-4">Action</div>,
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <Link to={`${ROUTES.STAFF_DETAIL}/${row.original.staff_id}?tab=compliance#req-${row.original.compliance_type_id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: requirements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
      sorting
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true
  });

  return (
    <Container>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck className="size-6 text-gray-600 dark:text-gray-400" />
              Compliance Monitoring
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor individual staff compliance requirements and document expiries across the organization.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.REPORT_COMPLIANCE || '#'}>
              <Button variant="outline" size="sm">
                <FileText className="size-4 mr-2" />
                Compliance Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <Input
              placeholder="Search by staff name or requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10.5 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest sm:whitespace-nowrap">Document Status:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Missing', 'Expired', 'Expiring Soon', 'In Progress', 'Complete'].map((s) => {
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
                        setSelectedStatuses(selectedStatuses.filter(v => v !== s));
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

        {/* Requirements DataGrid */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Compliance Audit Directory</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="p-12 text-center">
                <AlertTriangle className="size-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-700">Audit Data Unavailable</h3>
                <p className="text-sm text-red-500 max-w-md mx-auto mt-2">
                  {(error as any).message || 'An unexpected error occurred while fetching compliance records. Please check your network connection or permissions.'}
                </p>
                <Button variant="outline" size="sm" className="mt-6 border-red-200 text-red-700 hover:bg-red-50" onClick={() => window.location.reload()}>
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
