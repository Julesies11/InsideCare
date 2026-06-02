import { useQuery } from '@tanstack/react-query';
import { SortingState } from '@tanstack/react-table';
import { QUERY_KEYS } from '@/config/query-keys';
import { checklistsApi } from '@/api/checklists.api';

export interface ChecklistSubmission {
  id: string;
  checklist_id: string;
  house_id: string;
  submitted_by?: string;
  status: string;
  scheduled_date?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  checklist_name?: string;
  staff_name?: string;
  house_name?: string;
  item_count?: number;
  completed_item_count?: number;
}

export interface ChecklistHistoryFilters {
  houseIds?: string[];
  staffId?: string; // If provided, only shows checklists by this staff member
  searchTerm?: string;
}

export function useChecklistHistory(
  pageIndex: number = 0,
  pageSize: number = 10,
  sorting: SortingState = [],
  filters: ChecklistHistoryFilters = {}
) {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECKLIST_HISTORY, pageIndex, pageSize, sorting, filters],
    queryFn: async () => {
      const result = await checklistsApi.getChecklistHistory({
        pageIndex,
        pageSize,
        sorting: sorting as Array<{ id: string; desc: boolean }>,
        filters
      });

      return {
        data: result.data as ChecklistSubmission[],
        count: result.count
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
