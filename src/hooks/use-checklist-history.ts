import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SortingState } from '@tanstack/react-table';

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

const CHECKLIST_SUBMISSION_COLUMNS = `
  id, checklist_id, house_id, submitted_by, status, scheduled_date, started_at, completed_at, created_at, updated_at,
  house_checklists (name),
  staff (name),
  houses (name),
  house_checklist_submission_items (is_completed)
`;

export function useChecklistHistory(
  pageIndex: number = 0,
  pageSize: number = 10,
  sorting: SortingState = [],
  filters: ChecklistHistoryFilters = {}
) {
  return useQuery({
    queryKey: ['checklist-history', pageIndex, pageSize, sorting, filters],
    queryFn: async () => {
      let query = supabase
        .from('house_checklist_submissions')
        .select(CHECKLIST_SUBMISSION_COLUMNS, { count: 'exact' });

      // Apply House Filters
      if (filters.houseIds && filters.houseIds.length > 0) {
        query = query.in('house_id', filters.houseIds);
      }

      // Apply Staff Filter
      if (filters.staffId) {
        query = query.eq('submitted_by', filters.staffId);
      }

      // Apply Search (across checklist name or staff name)
      // Note: Supabase doesn't support complex text search across joins easily in a single query filter, 
      // but we can filter by checklist_id or house_id if we had names. 
      // For now, we'll keep it simple or implement a view if needed, but per mandates we avoid views.
      // We'll skip complex text search for now to stay performant.

      // Apply Sorting
      if (sorting.length > 0) {
        const sort = sorting[0];
        query = query.order(sort.id, { ascending: !sort.desc });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      // Apply Pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const submissions = (data || []).map(sub => {
        const checklists = (sub as any).house_checklists as unknown as { name: string } | null;
        const staff = (sub as any).staff as unknown as { name: string } | null;
        const house = (sub as any).houses as unknown as { name: string } | null;
        const items = ((sub as any).house_checklist_submission_items as unknown as Array<{ is_completed: boolean }>) || [];
        
        return {
          ...sub,
          checklist_name: checklists?.name || 'Deleted Checklist',
          staff_name: staff?.name || 'Unknown Staff',
          house_name: house?.name || 'Unknown House',
          item_count: items.length || 0,
          completed_item_count: items.filter((i) => i.is_completed).length || 0
        };
      }) as ChecklistSubmission[];

      return {
        data: submissions,
        count: count || 0
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
