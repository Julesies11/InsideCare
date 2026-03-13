import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ChecklistMasterItem {
  id: string;
  master_id: string;
  title: string;
  instructions?: string;
  priority: string;
  is_required: boolean;
  sort_order: number;
}

export interface ChecklistMaster {
  id: string;
  name: string;
  frequency: string;
  description?: string;
  items?: ChecklistMasterItem[];
}

const CHECKLIST_MASTER_COLUMNS = `
  id, name, frequency, description,
  items:checklist_item_master (id, master_id, title, instructions, priority, is_required, sort_order)
`;

export function useChecklistMaster() {
  const query = useQuery({
    queryKey: ['checklist-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_master')
        .select(CHECKLIST_MASTER_COLUMNS)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(checklist => ({
        ...checklist,
        items: ((checklist.items as ChecklistMasterItem[]) || []).sort((a, b) => a.sort_order - b.sort_order)
      })) as ChecklistMaster[];
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
