import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ChecklistSubmission {
  id: string;
  checklist_id: string;
  house_id: string;
  submitted_by?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  checklist_name?: string;
  staff_name?: string;
  item_count?: number;
  completed_item_count?: number;
}

const CHECKLIST_SUBMISSION_COLUMNS = `
  id, checklist_id, house_id, submitted_by, status, started_at, completed_at, created_at, updated_at,
  house_checklists (name),
  staff (name),
  house_checklist_submission_items (is_completed)
`;

export function useChecklistHistory(houseId?: string) {
  const query = useQuery({
    queryKey: ['checklist-history', houseId],
    queryFn: async () => {
      if (!houseId) return [];

      const { data, error } = await supabase
        .from('house_checklist_submissions')
        .select(CHECKLIST_SUBMISSION_COLUMNS)
        .eq('house_id', houseId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(sub => {
        const checklists = sub.house_checklists as unknown as { name: string } | null;
        const staff = sub.staff as unknown as { name: string } | null;
        const items = (sub.house_checklist_submission_items as unknown as Array<{ is_completed: boolean }>) || [];
        
        return {
          ...sub,
          checklist_name: checklists?.name || 'Deleted Checklist',
          staff_name: staff?.name || 'Unknown Staff',
          item_count: items.length || 0,
          completed_item_count: items.filter((i) => i.is_completed).length || 0
        };
      }) as ChecklistSubmission[];
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    submissions: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
