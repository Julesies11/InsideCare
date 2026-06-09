'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, X, ClipboardList, ShieldAlert, Clock, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ROUTES } from '@/config/routes.config';
import { useIncidentReports } from '@/hooks/use-incident-reports';
import { IncidentReport } from '@/models/incident-report';
import { cn } from '@/lib/utils';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

type TabKey = 'all' | 'New' | 'Actioned' | 'Referred' | 'Closed';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'all',      label: 'All Incidents', icon: ClipboardList },
  { key: 'New',      label: 'New',           icon: ShieldAlert   },
  { key: 'Actioned', label: 'Actioned',      icon: Clock         },
  { key: 'Referred', label: 'Referred',      icon: ArrowRightLeft },
  { key: 'Closed',   label: 'Closed',        icon: CheckCircle2  },
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

  const getInitialSorting = (): SortingState => {
    const sortParam = searchParams.get('sort');
    if (!sortParam) return [];
    
    const [field, direction] = sortParam.split('.');
    return [{ id: field, desc: direction === 'desc' }];
  };

  const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting());
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'all'
  );

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch status counts matching the current search criteria
  const { data: counts } = useQuery({
    queryKey: [QUERY_KEYS.INCIDENT_REPORTS, 'status-counts', debouncedSearch],
    queryFn: async () => {
      const getCountQuery = (status?: string) => {
        let q = supabase
          .from(TABLES.INCIDENT_REPORTS)
          .select('id', { count: 'exact', head: true });
        
        if (status) {
          q = q.eq('admin_status', status);
        }
        if (debouncedSearch) {
          q = q.or(`summary.ilike.%${debouncedSearch}%,details.ilike.%${debouncedSearch}%`);
        }
        return q;
      };

      const [allRes, newRes, actionedRes, referredRes, closedRes] = await Promise.all([
        getCountQuery(),
        getCountQuery('New'),
        getCountQuery('Actioned'),
        getCountQuery('Referred'),
        getCountQuery('Closed'),
      ]);

      return {
        all: allRes.count || 0,
        New: newRes.count || 0,
        Actioned: actionedRes.count || 0,
        Referred: referredRes.count || 0,
        Closed: closedRes.count || 0,
      };
    },
  });

  const tabCounts = counts || {
    all: 0,
    New: 0,
    Actioned: 0,
    Referred: 0,
    Closed: 0,
  };

  const { data, isLoading } = useIncidentReports({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    status: activeTab === 'all' ? undefined : activeTab,
    sort: sorting.map(s => ({ id: s.id, desc: s.desc }))
  });

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
    
    // Tab Filter
    if (activeTab !== 'all') {
      params.set('tab', activeTab);
    } else {
      params.delete('tab');
    }

    // Update URL immediately without adding to history if changed
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [pagination, sorting, searchQuery, activeTab, setSearchParams, searchParams]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'reference_id',
      accessorKey: 'reference_id',
      header: ({ column }) => <DataGridColumnHeader title="Incident ID" column={column} />,
      size: 150,
      enablePinning: true,
      cell: ({ row }) => (
        <button 
          onClick={() => onEdit(row.original)}
          className="font-mono font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer text-left font-sans"
        >
          {row.original.reference_id || '—'}
        </button>
      ),
    },
    {
      id: 'incident_date',
      accessorKey: 'incident_date',
      header: ({ column }) => <DataGridColumnHeader title="Incident Date" column={column} />,
      size: 160,
      cell: ({ row }) => (
        <div className="flex flex-col text-left text-sm text-mono">
          <span className="font-normal text-gray-800 dark:text-gray-200">{format(new Date(row.original.incident_date), 'dd MMM yyyy')}</span>
          <span className="text-xs text-gray-400">{format(new Date(row.original.incident_date), 'HH:mm')}</span>
        </div>
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
    {
      id: 'admin_status',
      accessorKey: 'admin_status',
      header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
      size: 120,
      cell: ({ row }) => {
        const status = row.original.admin_status || 'New';
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] uppercase font-bold",
              status === 'New' ? "border-amber-500 text-amber-500 bg-amber-50" :
              status === 'Actioned' ? "border-blue-500 text-blue-500 bg-blue-50" :
              status === 'Referred' ? "border-purple-500 text-purple-500 bg-purple-50" :
              "border-emerald-500 text-emerald-500 bg-emerald-50"
            )}
          >
            {status}
          </Badge>
        );
      },
    },
  ], [onEdit]);

  const table = useReactTable({
    data: data?.data || [],
    columns,
    pageCount: Math.ceil((data?.count || 0) / pagination.pageSize),
    state: { 
      pagination, 
      sorting,
      columnPinning: { left: ['reference_id'] }
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border p-1 overflow-x-auto bg-muted/40">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              table.setPageIndex(0);
            }}
            className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center cursor-pointer ${
              activeTab === key
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span>{label}</span>
            <span className={cn(
              "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold transition-all",
              activeTab === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/15 border border-muted-foreground/10'
            )}>
              {tabCounts[key]}
            </span>
          </button>
        ))}
      </div>

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
          tableClassNames={{
            base: 'min-w-[1000px]'
          }}
        >
          <CardTable>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </DataGrid>
      </Card>
    </div>
  );
}

