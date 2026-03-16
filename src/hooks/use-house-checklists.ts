import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HouseChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  instructions?: string;
  priority: string;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HouseChecklist {
  id: string;
  house_id: string;
  name: string;
  frequency: string;
  days_of_week?: string[];
  description?: string;
  master_id?: string;
  created_at: string;
  updated_at: string;
  items?: HouseChecklistItem[];
  latest_submission?: {
    id: string;
    status: string;
    updated_at: string;
    scheduled_date: string;
  };
}

const HOUSE_CHECKLIST_COLUMNS = `
  id, house_id, name, frequency, description, master_id, created_at, updated_at,
  house_checklist_items (id, checklist_id, title, instructions, priority, is_required, sort_order, created_at, updated_at)
`;

export function useHouseChecklists(houseId?: string, scheduledDate?: string) {
  const query = useQuery({
    queryKey: ['house-checklists', houseId, scheduledDate],
    queryFn: async () => {
      if (!houseId) return [];

      // Fetch checklists with items
      const { data: checklists, error: clError } = await supabase
        .from('house_checklists')
        .select(`
          id, house_id, name, frequency, days_of_week, description, master_id, created_at, updated_at,
          house_checklist_items (id, checklist_id, title, instructions, priority, is_required, sort_order, created_at, updated_at)
        `)
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (clError) throw clError;

      // Fetch latest in_progress submissions for these checklists in this house
      // If scheduledDate is provided, only fetch for that specific date
      let subQuery = supabase
        .from('house_checklist_submissions')
        .select('id, checklist_id, status, updated_at, scheduled_date')
        .eq('house_id', houseId);
        
      if (scheduledDate) {
        subQuery = subQuery.eq('scheduled_date', scheduledDate);
      } else {
        subQuery = subQuery.eq('status', 'in_progress');
      }

      const { data: submissions, error: subError } = await subQuery;

      if (subError) throw subError;

      // Combine data
      return (checklists || []).map(cl => ({
        ...cl,
        items: ((cl.house_checklist_items as HouseChecklistItem[]) || []).sort((a, b) => a.sort_order - b.sort_order),
        latest_submission: submissions?.find(s => s.checklist_id === cl.id)
      })) as HouseChecklist[];
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    houseChecklists: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
