import { useEffect, useMemo, useState } from 'react';
import { PaginationState, SortingState } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  Plus,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useMedicationsMaster,
  useMedicationTypes,
} from '@/hooks/use-medications-master';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Container } from '@/components/common/container';
import { MedicationTypeMasterDialog } from './components/medication-type-master-dialog';

type SortField = 'medication_name' | 'category' | 'side_effects' | 'is_active';

export function MedicationRegisterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasAccess } = useRBAC();

  // Helper functions to parse URL params into initial state
  const getInitialPagination = (): PaginationState => ({
    pageIndex: Math.max(0, parseInt(searchParams.get('page') || '1') - 1),
    pageSize: parseInt(searchParams.get('pageSize') || '50'),
  });

  const getInitialSorting = (): SortingState => {
    const sort = searchParams.get('sort');
    if (!sort) return [{ id: 'medication_name', desc: false }];
    const [id, direction] = sort.split('.');
    return [{ id, desc: direction === 'desc' }];
  };

  const [pagination, setPagination] = useState<PaginationState>(
    getInitialPagination(),
  );
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting());
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || '',
  );
  const [selectedTypeId, setSelectedTypeId] = useState(
    searchParams.get('type') || 'all',
  );
  const [includeInactive, setIncludeInactive] = useState(
    searchParams.get('inactive') === 'true',
  );
  const [typeMasterOpen, setTypeMasterOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const canEdit = hasAccess({
    resource: RBAC_MODULES.MASTER_LISTS,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const canManageTypes = hasAccess({
    resource: RBAC_MODULES.ACCESS_CONTROL,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  const {
    medications,
    count,
    isLoading: loading,
  } = useMedicationsMaster(
    pagination.pageIndex,
    pagination.pageSize,
    sorting.map((s) => ({ id: s.id, desc: s.desc })),
    {
      search: debouncedSearch,
      typeId: selectedTypeId,
      includeInactive: includeInactive,
    },
  );

  // Sync state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();

    if (pagination.pageIndex > 0) {
      params.set('page', (pagination.pageIndex + 1).toString());
    }
    if (pagination.pageSize !== 50) {
      params.set('pageSize', pagination.pageSize.toString());
    }

    if (sorting.length > 0) {
      const sort = sorting[0];
      params.set('sort', `${sort.id}.${sort.desc ? 'desc' : 'asc'}`);
    }

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }

    if (selectedTypeId !== 'all') {
      params.set('type', selectedTypeId);
    }

    if (includeInactive) {
      params.set('inactive', 'true');
    }

    setSearchParams(params, { replace: true });
  }, [
    pagination,
    sorting,
    debouncedSearch,
    selectedTypeId,
    includeInactive,
    setSearchParams,
  ]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, selectedTypeId, includeInactive]);

  const handleSort = (field: SortField) => {
    setSorting((prev) => {
      const isDesc = prev[0]?.id === field && !prev[0]?.desc;
      return [{ id: field, desc: isDesc }];
    });
  };

  const handleAddMedication = () => {
    navigate(`${ROUTES.MEDICATION_REGISTER}/new`);
  };

  const handleEditMedication = (id: string) => {
    navigate(`${ROUTES.MEDICATION_REGISTER}/${id}`);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    const activeSort = sorting[0];
    if (activeSort?.id !== field)
      return <ArrowUpDown className="size-4 ms-1 inline opacity-30" />;
    return activeSort.desc ? (
      <ArrowDown className="size-4 ms-1 inline" />
    ) : (
      <ArrowUp className="size-4 ms-1 inline" />
    );
  };

  // Optimized type fetching - Filter to only active types for the dropdown
  const { data: medicationTypes = [] } = useMedicationTypes(false);

  // Mock table object for DataGrid context
  const tableInstance = {
    getState: () => ({ pagination }),
    setPagination: (updater: any) => {
      const nextValue =
        typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(nextValue);
    },
    getPageCount: () => Math.ceil(count / pagination.pageSize),
    getCanPreviousPage: () => pagination.pageIndex > 0,
    getCanNextPage: () =>
      (pagination.pageIndex + 1) * pagination.pageSize < count,
    previousPage: () =>
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 })),
    nextPage: () =>
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 })),
    setPageIndex: (index: number) =>
      setPagination((prev) => ({ ...prev, pageIndex: index })),
    setPageSize: (size: number) =>
      setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: size })),
    getFilteredRowModel: () => ({ rows: { length: count } }),
  };

  return (
    <Container>
      <div className="flex flex-col gap-5 lg:gap-7.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100">
              Medication Register
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button size="sm" onClick={handleAddMedication}>
                <Plus className="size-4 me-2" />
                Add Medication
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search medications..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={selectedTypeId}
                    onValueChange={setSelectedTypeId}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {medicationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.medication_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 ps-2 border-s">
                  <Switch
                    id="show-inactive"
                    checked={includeInactive}
                    onCheckedChange={setIncludeInactive}
                  />
                  <Label
                    htmlFor="show-inactive"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Include Inactive
                  </Label>
                </div>
              </div>
            </div>

            <DataGrid
              table={tableInstance as any}
              recordCount={count}
              isLoading={loading}
            >
              {loading ? (
                <div className="py-20 text-center">
                  <div
                    className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary"
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-4 text-muted-foreground">
                    Loading medications...
                  </p>
                </div>
              ) : medications.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground border rounded-lg border-dashed">
                  {searchQuery || selectedTypeId !== 'all'
                    ? 'No medications found matching your filters.'
                    : 'No medications found in the register.'}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead
                            className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100"
                            onClick={() => handleSort('medication_name')}
                          >
                            Medication Name
                            <SortIcon field="medication_name" />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100"
                            onClick={() => handleSort('category')}
                          >
                            Type
                            <SortIcon field="category" />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100"
                            onClick={() => handleSort('side_effects')}
                          >
                            General Side Effects
                            <SortIcon field="side_effects" />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100"
                            onClick={() => handleSort('is_active')}
                          >
                            Status
                            <SortIcon field="is_active" />
                          </TableHead>
                          <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medications.map((med) => (
                          <TableRow
                            key={med.id}
                            className="group hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <Link
                                to={`${ROUTES.MEDICATION_REGISTER}/${med.id}`}
                                className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                              >
                                {med.medication_name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {med.medication_type?.medication_type_name ? (
                                <Badge variant="secondary" appearance="outline">
                                  {med.medication_type.medication_type_name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  -
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                              {med.side_effects || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  med.is_active ? 'success' : 'secondary'
                                }
                              >
                                {med.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMedication(med.id);
                                }}
                              >
                                <Edit className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4">
                    <DataGridPagination />
                  </div>
                </>
              )}
            </DataGrid>
          </CardContent>
        </Card>
      </div>
      <MedicationTypeMasterDialog
        open={typeMasterOpen}
        onClose={() => setTypeMasterOpen(false)}
        canEdit={canManageTypes}
      />
    </Container>
  );
}
