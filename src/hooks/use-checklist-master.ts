import { masterListsApi } from '@/api/master-lists.api';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export interface ChecklistMasterItem {
  id: string;
  master_id: string;
  title: string;
  instructions: string | null;
  group_title: string;
  priority: string;
  is_required: boolean;
  sort_order: number;
}

export interface ChecklistMaster {
  id: string;
  checklist_name: string;
  days_of_week: string[] | null;
  description: string | null;
  items?: ChecklistMasterItem[];
}

export function useChecklistMaster() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.CHECKLIST_MASTER],
    queryFn: async () => {
      const data = await masterListsApi.checklists.list();
      return data as unknown as ChecklistMaster[];
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
