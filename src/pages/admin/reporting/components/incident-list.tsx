'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, X, Edit } from 'lucide-react';
import { useSearchParams, Link } from 'react-router';
import { useDebounce } from '@/hooks/use-debounce';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGrid } from '@/components/ui/data-grid';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ROUTES } from '@/config/routes.config';
import { useIncidentReports } from '@/hooks/use-incident-reports';
import { IncidentReport } from '@/models/incident-report';
import { cn } from '@/lib/utils';
import { StatusFilter, StatusOption } from '@/components/ui/status-filter';
import { SecureAvatar } from '@/components/ui/secure-avatar';

const INCIDENT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'New', label: 'New', badge: 'warning' },
  { value: 'Actioned', label: 'Actioned', badge: 'info' },
  { value: 'Referred', label: 'Referred', badge: 'primary' },
  { value: 'Closed', label: 'Closed', badge: 'success' },
];

interface IncidentListProps {
  onEdit: (incident: IncidentReport) => void;
}

export function IncidentList({ onEdit }: IncidentListProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State helpers
  const getInitialPagination = (): PaginationState => ({
    pageIndex: Math.max(0, parseInt(searchParams.get('page') || '1') - 1),
    pageSize: parseInt(searchParams.get('pageSize') || '25'),
  });

  const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.get('statuses')?.split(',').filter(Boolean) || []
  );

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading } = useIncidentReports({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    sort: sorting.map(s => ({ id: s.id, desc: s.desc }))
  });

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'incident_date',
      accessorKey: 'incident_date',
      header: ({ column }) => <DataGridColumnHeader title="Date & Time" column={column} />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{format(new Date(row.original.incident_date), 'dd MMM yyyy')}</span>
          <span className="text-xs text-gray-400">{format(new Date(row.original.incident_date), 'HH:mm')}</span>
        </div>
      ),
    },
    {
      id: 'involved_participant_id',
      accessorKey: 'participant.participant_name',
      header: ({ column }) => <DataGridColumnHeader title="Participant" column={column} />,
      cell: ({ row }) => (
        <Link 
          to={`${ROUTES.PARTICIPANT_DETAIL}/${row.original.participant?.id}`}
          className="group flex items-center gap-3 text-sm font-medium text-blue-700 transition-colors"
        >
          <SecureAvatar
            src={row.original.participant?.photo_url}
            alt={row.original.participant?.participant_name}
            size="xs"
          />
          <span className="group-hover:underline">
            {row.original.participant?.participant_name || 'General Context'}
          </span>
        </Link>
      ),
    },
    {
      id: 'type',
      accessorKey: 'incident_type_info.name',
      header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase">{row.original.incident_type_info?.name || 'Unknown'}</span>
          <div className="flex gap-1">
            {row.original.is_restrictive_practice && (
              <Badge variant="warning" className="text-[9px] px-1.5 h-4 font-black">RP</Badge>
            )}
            {row.original.is_ndis_reportable && (
              <Badge variant="destructive" className="text-[9px] px-1.5 h-4 font-black">NDIS</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'summary',
      accessorKey: 'summary',
      header: ({ column }) => <DataGridColumnHeader title="Summary" column={column} />,
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <p className="text-sm line-clamp-2 italic text-gray-600">"{row.original.summary}"</p>
        </div>
      ),
    },
    {
      id: 'severity',
      accessorKey: 'severity',
      header: ({ column }) => <DataGridColumnHeader title="Severity" column={column} />,
      cell: ({ row }) => (
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] uppercase font-bold",
            row.original.severity === 'High' ? "border-red-500 text-red-500 bg-red-50" :
            row.original.severity === 'Moderate' ? "border-orange-500 text-orange-500 bg-orange-50" :
            "border-gray-300 text-gray-500"
          )}
        >
          {row.original.severity}
        </Badge>
      ),
    },
    {
      id: 'admin_status',
      accessorKey: 'admin_status',
      header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
      cell: ({ row }) => (
        <Badge 
          variant={
            row.original.admin_status === 'Closed' ? 'success' :
            row.original.admin_status === 'Actioned' ? 'info' :
            row.original.admin_status === 'Referred' ? 'primary' :
            'warning'
          }
        >
          {row.original.admin_status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right pr-4">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2 pr-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)} title="View/Edit Details">
            <Edit className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [onEdit]);

  const table = useReactTable({
    data: data?.data || [],
    columns,
    pageCount: Math.ceil((data?.count || 0) / pagination.pageSize),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-wrap gap-4 py-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search summary/details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-64"
            />
            {searchQuery && (
              <Button variant="ghost" mode="icon" className="absolute end-1 top-1/2 -translate-y-1/2 size-6" onClick={() => setSearchQuery('')}>
                <X className="size-3" />
              </Button>
            )}
          </div>
          <StatusFilter 
            options={INCIDENT_STATUS_OPTIONS}
            value={selectedStatuses}
            onChange={setSelectedStatuses}
            label="Status"
          />
        </div>
      </CardHeader>
      <DataGrid table={table} recordCount={data?.count || 0} isLoading={isLoading}>
        <CardTable>
          <ScrollArea className="w-full">
            <DataGridTable />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </DataGrid>
    </Card>
  );
}
