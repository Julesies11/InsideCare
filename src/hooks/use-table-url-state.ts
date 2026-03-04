import { useState, useEffect, useMemo } from 'react';
import { PaginationState, SortingState } from '@tanstack/react-table';
import { useDebouncedSearchParams } from '@/hooks/use-debounced-search-params';

interface UseTableUrlStateProps {
  defaultPageSize?: number;
  defaultSort?: SortingState;
  defaultStatuses?: string[];
  statusOptions?: { value: string }[];
}

export function useTableUrlState({
  defaultPageSize = 10,
  defaultSort = [],
  defaultStatuses = ['active', 'draft'],
  statusOptions = [],
}: UseTableUrlStateProps = {}) {
  const [searchParams, setSearchParams] = useDebouncedSearchParams(300);

  const getInitialPagination = (): PaginationState => ({
    pageIndex: Math.max(0, parseInt(searchParams.get('page') || '1') - 1),
    pageSize: parseInt(searchParams.get('pageSize') || defaultPageSize.toString()),
  });

  const getInitialSorting = (): SortingState => {
    const sortParam = searchParams.get('sort');
    if (!sortParam) return defaultSort;
    
    const [field, direction] = sortParam.split('.');
    return [{ id: field, desc: direction === 'desc' }];
  };

  const getInitialSearch = (): string => {
    return searchParams.get('search') || '';
  };

  const getInitialStatuses = (): string[] => {
    const param = searchParams.get('statuses');
    if (!param) return defaultStatuses;
    if (statusOptions.length > 0) {
      return param.split(',').filter((s) => statusOptions.some(opt => opt.value === s));
    }
    return param.split(',');
  };

  const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting());
  const [searchQuery, setSearchQuery] = useState(getInitialSearch());
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(getInitialStatuses());

  // Additional generic array filter (e.g. houses)
  const getInitialArrayFilter = (key: string): string[] => {
    const param = searchParams.get(key);
    return param ? param.split(',') : [];
  };

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (pagination.pageIndex > 0) {
      params.set('page', (pagination.pageIndex + 1).toString());
    }
    if (pagination.pageSize !== defaultPageSize) {
      params.set('pageSize', pagination.pageSize.toString());
    }
    
    if (sorting.length > 0) {
      const sort = sorting[0];
      params.set('sort', `${sort.id}.${sort.desc ? 'desc' : 'asc'}`);
    }
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    params.set('statuses', selectedStatuses.join(','));

    setSearchParams(params, { replace: true });
  }, [pagination, sorting, searchQuery, selectedStatuses, setSearchParams, defaultPageSize]);

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    setSelectedStatuses,
    getInitialArrayFilter,
  };
}
