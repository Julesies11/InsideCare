'use client';

import { useEffect, useMemo, useState } from 'react';
import { staffApi } from '@/api/staff.api';
import { ActivityLog, ActivityType } from '@/models/activity-log';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { format, isValid, parseISO } from 'date-fns';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Eye,
  History,
  Key,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Link, useSearchParams } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { cn } from '@/lib/utils';
import { useActivityLog } from '@/hooks/use-activity-log';
import { useDebounce } from '@/hooks/use-debounce';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardFooter, CardTable, CardToolbar } from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ACTIVITY_TYPE_BADGES: Record<ActivityType, { variant: any; icon: any }> =
  {
    create: { variant: 'success', icon: ShieldCheck },
    update: { variant: 'warning', icon: History },
    delete: { variant: 'destructive', icon: X },
    login: { variant: 'primary', icon: Key },
  };

const FIELD_LABELS: Record<string, string> = {
  staff_name: 'Staff Name',
  participant_name: 'Participant Name',
  status: 'Status',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  date_of_birth: 'Date of Birth',
  house_id: 'House Assignment',
  role_id: 'Role',
  employment_type: 'Employment Type',
  ndis_number: 'NDIS Number',
};

/**
 * Gold Standard Visual Diff Component
 */
function formatMetadataValue(val: any): string {
  if (val === null || val === undefined) return '(empty)';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function ChangeDiff({ changes }: { changes: any }) {
  const changeEntries = Object.entries(changes || {});

  if (changeEntries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-dashed">
        No granular field changes recorded.
      </p>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden mt-2 bg-white dark:bg-slate-950">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
          <tr>
            <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-tight">
              Field
            </th>
            <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-tight">
              Original
            </th>
            <th className="px-1 py-2.5 w-8"></th>
            <th className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-tight">
              New Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
          {changeEntries.map(([key, value]: [string, any]) => (
            <tr
              key={key}
              className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                {FIELD_LABELS[key] || key.replace('_', ' ')}
              </td>
              <td className="px-4 py-3">
                <span className="text-red-600 dark:text-red-400 line-through bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded font-mono">
                  {formatMetadataValue(value?.old)}
                </span>
              </td>
              <td className="px-0 py-3 text-muted-foreground text-center">
                <ArrowRight className="size-3 opacity-50" />
              </td>
              <td className="px-4 py-3">
                <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded font-bold font-mono">
                  {formatMetadataValue(value?.new)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityLogTable() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Source of Truth: URL Parameters
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search') || '';
  const category = (searchParams.get('category') as any) || 'all';
  const staff = searchParams.get('staff') || 'all';
  const module = searchParams.get('module') || 'all';
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  const dateRange = useMemo(() => {
    if (!fromStr) return undefined;
    const from = parseISO(fromStr);
    const to = toStr ? parseISO(toStr) : undefined;
    if (isValid(from)) {
      return { from, to: to && isValid(to) ? to : undefined };
    }
    return undefined;
  }, [fromStr, toStr]);

  // UI state for search input (to allow typing before committing to URL)
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 400);

  const [inspectingActivity, setInspectingActivity] =
    useState<ActivityLog | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>(
    [],
  );

  // 2. Fetch data based on URL Source of Truth
  const { activities, count, loading } = useActivityLog({
    pageIndex: page - 1,
    pageSize: pageSize,
    sort: [{ id: 'created_at', desc: true }],
    category,
    search: debouncedSearch,
    userName: staff === 'all' ? undefined : staff,
    module: module === 'all' ? undefined : module,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
  });

  // 3. Effect: Fetch staff for dropdown
  useEffect(() => {
    const fetchStaff = async () => {
      const names = await staffApi.listNames();
      setStaffList(names.map((name) => ({ id: name, name: name })));
    };
    fetchStaff();
  }, []);

  // 4. Update Search to URL after debounce
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      if (params.get('search') !== debouncedSearch) {
        params.set('search', debouncedSearch);
        params.set('page', '1'); // Reset pagination on search
        setSearchParams(params, { replace: true });
      }
    } else if (params.has('search')) {
      params.delete('search');
      params.set('page', '1');
      setSearchParams(params, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams]);

  // 5. Handlers for URL State Updates
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all') params.delete(key);
      else params.set(key, value);
    });
    // Always reset page to 1 when filters change (unless updating page specifically)
    if (!updates.page) params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  const handlePageChange = (pageIndex: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', (pageIndex + 1).toString());
    setSearchParams(params, { replace: true });
  };

  const columns = useMemo<ColumnDef<ActivityLog>[]>(
    () => [
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataGridColumnHeader title="Date & Time" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <CalendarIcon className="size-3.5 text-muted-foreground" />
            {format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm')}
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-32" /> },
        size: 180,
      },
      {
        id: 'user_name',
        accessorKey: 'user_name',
        header: ({ column }) => (
          <DataGridColumnHeader title="User" column={column} />
        ),
        cell: ({ row }) => {
          const staff = (row.original as any).staff;
          const name = row.original.user_name || 'System';
          const initials = name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          if (!staff?.id) {
            return (
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-3 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {name}
                </span>
              </div>
            );
          }

          return (
            <Link
              to={`${ROUTES.STAFF_DETAIL}/${staff.id}`}
              className="flex items-center gap-2 group/user w-fit"
            >
              <SecureAvatar
                src={staff.photo_url}
                initials={initials}
                className="size-6 transition-all group-hover/user:ring-2 group-hover/user:ring-primary/20"
                bucket={STORAGE_BUCKETS.STAFF_PHOTOS}
              />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover/user:underline transition-colors">
                {name}
              </span>
            </Link>
          );
        },
        meta: { skeleton: <Skeleton className="h-4 w-24" /> },
        size: 180,
      },
      {
        id: 'activity_type',
        accessorKey: 'activity_type',
        header: ({ column }) => (
          <DataGridColumnHeader title="Action" column={column} />
        ),
        cell: ({ row }) => {
          const type = row.original.activity_type as ActivityType;
          const config = ACTIVITY_TYPE_BADGES[type] || {
            variant: 'secondary',
            icon: ShieldCheck,
          };
          const Icon = config.icon;
          return (
            <Badge
              variant={config.variant}
              appearance="light"
              className="gap-1.5 capitalize py-0.5"
            >
              <Icon className="size-3" />
              {type}
            </Badge>
          );
        },
        meta: { skeleton: <Skeleton className="h-5 w-16 rounded-full" /> },
        size: 120,
      },
      {
        id: 'entity_type',
        accessorKey: 'entity_type',
        header: ({ column }) => (
          <DataGridColumnHeader title="Module" column={column} />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="text-[10px] uppercase tracking-wider font-bold"
          >
            {row.original.entity_type.replace('_', ' ').replace('ic ', '')}
          </Badge>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-20 rounded-full" /> },
        size: 130,
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title="Description" column={column} />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-gray-600 dark:text-gray-400 py-2 leading-normal break-words whitespace-normal min-w-[320px]">
            {row.original.description || '-'}
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-full" /> },
        size: 450,
      },
      {
        id: 'actions',
        header: 'Details',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setInspectingActivity(row.original)}
          >
            <Eye className="size-3.5" />
            Inspect
          </Button>
        ),
        size: 100,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: activities,
    columns,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
      sorting: [{ id: 'created_at', desc: true }],
    },
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;
      handlePageChange(newState.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(count / pageSize),
  });

  return (
    <>
      <DataGrid table={table} recordCount={count} isLoading={loading}>
        <Card id="activity_log">
          <CardToolbar className="flex flex-col gap-4 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <Tabs
                value={category}
                onValueChange={(v) => updateUrlParams({ category: v })}
              >
                <TabsList className="bg-slate-100 dark:bg-slate-900 border-none">
                  <TabsTrigger value="all">All Activity</TabsTrigger>
                  <TabsTrigger value="data_changes">Data Changes</TabsTrigger>
                  <TabsTrigger value="logins_security">
                    Logins & Security
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full sm:w-64">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search logs..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="ps-9 h-10"
                />
                {localSearch && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setLocalSearch('')}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full border-t pt-4 border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ps-1">
                  Staff Member
                </label>
                <Select
                  value={staff}
                  onValueChange={(v) => updateUrlParams({ staff: v })}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="All Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ps-1">
                  Module
                </label>
                <Select
                  value={module}
                  onValueChange={(v) => updateUrlParams({ module: v })}
                >
                  <SelectTrigger className="w-[160px] h-9 text-capitalize">
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="employees">Staff</SelectItem>
                    <SelectItem value="participants">Participants</SelectItem>
                    <SelectItem value="houses">Houses</SelectItem>
                    <SelectItem value="incidents">Incidents</SelectItem>
                    <SelectItem value="roles">Roles</SelectItem>
                    <SelectItem value="auth">Auth / Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ps-1">
                  Date Range
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'w-[240px] h-9 justify-start text-left font-normal',
                        !dateRange && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(r) =>
                        updateUrlParams({
                          from: r?.from?.toISOString() || null,
                          to: r?.to?.toISOString() || null,
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {(staff !== 'all' || module !== 'all' || dateRange || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-5 h-8 text-xs text-primary hover:text-primary-emphasis"
                  onClick={() => {
                    setLocalSearch('');
                    setSearchParams(new URLSearchParams(), { replace: true });
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </CardToolbar>

          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>

          <CardFooter className="py-4">
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <Dialog
        open={!!inspectingActivity}
        onOpenChange={(open) => !open && setInspectingActivity(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>

          {inspectingActivity && (
            <ScrollArea className="mt-4 flex-1 pr-4">
              <div className="space-y-6 pb-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Date & Time
                    </p>
                    <p className="text-sm">
                      {format(new Date(inspectingActivity.created_at), 'PPP p')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      User
                    </p>
                    <p className="text-sm font-medium">
                      {inspectingActivity.user_name || 'System'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Module
                    </p>
                    <p className="text-sm capitalize">
                      {inspectingActivity.entity_type
                        .replace('_', ' ')
                        .replace('ic ', '')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Entity
                    </p>
                    {[
                      'staff',
                      'participants',
                      'houses',
                      'employees',
                      'ic_staff',
                      'ic_participants',
                      'ic_houses',
                      'incident_reports',
                      'incident_report',
                    ].includes(inspectingActivity.entity_type) ? (
                      <Link
                        to={
                          inspectingActivity.entity_type === 'staff' ||
                          inspectingActivity.entity_type === 'employees' ||
                          inspectingActivity.entity_type === 'ic_staff'
                            ? `${ROUTES.STAFF_DETAIL}/${inspectingActivity.entity_id}`
                            : inspectingActivity.entity_type ===
                                  'participants' ||
                                inspectingActivity.entity_type ===
                                  'ic_participants'
                              ? `${ROUTES.PARTICIPANT_DETAIL}/${inspectingActivity.entity_id}`
                              : inspectingActivity.entity_type === 'houses' ||
                                  inspectingActivity.entity_type === 'ic_houses'
                                ? `${ROUTES.HOUSE_DETAIL}/${inspectingActivity.entity_id}`
                                : `${ROUTES.INCIDENT_REPORT}/${inspectingActivity.entity_id}`
                        }
                        className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        {inspectingActivity.entity_name ||
                          inspectingActivity.entity_id}
                      </Link>
                    ) : (
                      <p className="text-sm">
                        {inspectingActivity.entity_name ||
                          inspectingActivity.entity_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic border-l-2 border-primary/30 pl-3">
                    "{inspectingActivity.description}"
                  </p>
                </div>

                {inspectingActivity.metadata && (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold">Activity Details</p>
                    {inspectingActivity.activity_type === 'update' &&
                    inspectingActivity.metadata.changes ? (
                      <ChangeDiff
                        changes={inspectingActivity.metadata.changes}
                      />
                    ) : (
                      <div className="rounded-md overflow-hidden border">
                        <Code className="p-4 text-xs">
                          {JSON.stringify(inspectingActivity.metadata, null, 2)}
                        </Code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
