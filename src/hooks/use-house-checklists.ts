import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const getHouseChecklistsQuery = () => supabase
  .from('ic_house_checklists')
  .select(`
    id, house_id, house_checklist_name, days_of_week, description, master_id, sort_order, created_at, updated_at,
    house_checklist_items:ic_house_checklist_items(
      id, checklist_id, title, instructions, group_id, group_title, priority, is_required, sort_order, created_at, updated_at,
      group:ic_house_shift_templates(id, shift_template_name, short_name, color_theme)
    )
  `);

export type HouseChecklistWithRelations = Awaited<ReturnType<typeof getHouseChecklistsQuery>>['data'] extends (infer U)[] ? U : never;
export type HouseChecklistItem = HouseChecklistWithRelations['house_checklist_items'] extends (infer U)[] ? U : never;

export interface HouseChecklist extends Omit<HouseChecklistWithRelations, 'house_checklist_items'> {
  items?: HouseChecklistItem[];
  latest_submission?: {
    id: string;
    status: string;
    updated_at: string;
    scheduled_date: string;
  };
}

export function useHouseChecklists(houseId?: string, scheduledDate?: string) {
  const query = useQuery({
    queryKey: ['house-checklists', houseId, scheduledDate],
    queryFn: async () => {
      if (!houseId) return [];

      // Fetch checklists with items
      const { data: checklists, error: clError } = await supabase
        .from('ic_house_checklists')
        .select(`
          id, house_id, house_checklist_name, days_of_week, description, master_id, sort_order, created_at, updated_at,
          house_checklist_items:ic_house_checklist_items(
            id, checklist_id, title, instructions, group_id, group_title, priority, is_required, sort_order, created_at, updated_at,
            group:ic_house_shift_templates(id, shift_template_name, short_name, color_theme)
          )
        `)
        .eq('house_id', houseId)
        .order('sort_order', { ascending: true });

      if (clError) throw clError;

      // Fetch latest in_progress submissions for these checklists in this house
      // If scheduledDate is provided, only fetch for that specific date
      let subQuery = supabase
        .from('ic_house_checklist_submissions')
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
      })) as unknown as HouseChecklist[];
    },
    enabled: !!houseId,
    staleTime: 0, // Real-time RLS enforcement
  });

  return {
    ...query,
    houseChecklists: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
