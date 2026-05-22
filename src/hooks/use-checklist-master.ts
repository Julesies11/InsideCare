import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

const getChecklistMasterQuery = () => supabase
  .from(TABLES.CHECKLIST_MASTER)
  .select(`
    id, checklist_name, days_of_week, description,
    items:ic_checklist_item_master(id, master_id, title, instructions, group_title, priority, is_required, sort_order)
  `);

export type ChecklistMasterWithRelations = Awaited<ReturnType<typeof getChecklistMasterQuery>>['data'] extends (infer U)[] ? U : never;
export type ChecklistMasterItem = ChecklistMasterWithRelations['items'] extends (infer U)[] ? U : never;

export interface ChecklistMaster extends Omit<ChecklistMasterWithRelations, 'items'> {
  items?: ChecklistMasterItem[];
}

export function useChecklistMaster() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.CHECKLIST_MASTER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.CHECKLIST_MASTER)
        .select(`
          id, checklist_name, days_of_week, description,
          items:ic_checklist_item_master(id, master_id, title, instructions, group_title, priority, is_required, sort_order)
        `)
        .order('checklist_name', { ascending: true });

      if (error) throw error;

      return (data || []).map(checklist => ({
        ...checklist,
        items: ((checklist.items as ChecklistMasterItem[]) || []).sort((a, b) => a.sort_order - b.sort_order)
      })) as unknown as ChecklistMaster[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    ...query,
    masterChecklists: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
