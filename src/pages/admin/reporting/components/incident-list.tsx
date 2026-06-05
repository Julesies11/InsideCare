'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
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
import { STORAGE_BUCKETS } from '@/config/storage-buckets';

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
      size: 160,
      enablePinning: true,
      cell: ({ row }) => (
        <button 
          onClick={() => onEdit(row.original)}
          className="group flex flex-col text-left hover:underline transition-colors cursor-pointer"
        >
          <span className="font-medium text-blue-700 dark:text-blue-400">{format(new Date(row.original.incident_date), 'dd MMM yyyy')}</span>
          <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">{format(new Date(row.original.incident_date), 'HH:mm')}</span>
        </button>
      ),
    },
    {
      id: 'involved_participant_id',
      accessorKey: 'participant.participant_name',
      header: ({ column }) => <DataGridColumnHeader title="Participant" column={column} />,
      size: 200,
      cell: ({ row }) => {
        if (!row.original.participant) return null;
        return (
          <Link 
            to={`${ROUTES.PARTICIPANT_DETAIL}/${row.original.participant.id}`}
            className="group flex items-center gap-3 text-sm font-medium text-blue-700 dark:text-blue-400 transition-colors"
          >
            <SecureAvatar
              src={row.original.participant.photo_url}
              alt={row.original.participant.participant_name}
              className="size-8"
              bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
            />
            <span className="group-hover:underline">
              {row.original.participant.participant_name}
            </span>
          </Link>
        );
      },
    },
    {
      id: 'involved_staff_id',
      accessorKey: 'staff.staff_name',
      header: ({ column }) => <DataGridColumnHeader title="Staff" column={column} />,
      size: 200,
      cell: ({ row }) => {
        if (!row.original.staff) return null;
        return (
          <Link 
            to={`${ROUTES.STAFF_DETAIL}/${row.original.staff.id}`}
            className="group flex items-center gap-3 text-sm font-medium text-blue-700 dark:text-blue-400 transition-colors"
          >
            <SecureAvatar
              src={row.original.staff.photo_url}
              alt={row.original.staff.staff_name}
              className="size-8"
            />
            <span className="group-hover:underline">
              {row.original.staff.staff_name}
            </span>
          </Link>
        );
      },
    },
    {
      id: 'type',
      accessorKey: 'incident_type_info.name',
      header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
      size: 150,
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
      size: 350,
      cell: ({ row }) => (
        <div className="max-w-[350px]">
          <p className="text-sm line-clamp-2 italic text-gray-600 break-words whitespace-normal">"{row.original.summary}"</p>
        </div>
      ),
    },
    {
      id: 'severity',
      accessorKey: 'severity',
      header: ({ column }) => <DataGridColumnHeader title="Severity" column={column} />,
      size: 120,
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
  ], [onEdit]);

  const table = useReactTable({
    data: data?.data || [],
    columns,
    pageCount: Math.ceil((data?.count || 0) / pagination.pageSize),
    state: { 
      pagination, 
      sorting,
      columnPinning: { left: ['incident_date'] }
    },
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
      <DataGrid 
        table={table} 
        recordCount={data?.count || 0} 
        isLoading={isLoading}
        tableLayout={{ 
          width: 'auto',
          columnsPinnable: true 
        }}
      >
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

