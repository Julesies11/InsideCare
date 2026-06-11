import { checklistsApi } from '@/api/checklists.api';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export type HouseChecklistWithRelations = any; // Will be typed by api response
export type HouseChecklistItem = any;

export interface HouseChecklist {
  id: string;
  house_id: string;
  house_checklist_name: string;
  days_of_week: string[] | null;
  description: string | null;
  master_id: string | null;
  sort_order: number;
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

export function useHouseChecklists(houseId?: string, scheduledDate?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.CHECKLISTS, houseId, scheduledDate],
    queryFn: async () => {
      if (!houseId) return [];
      return (await checklistsApi.listHouseChecklists(
        houseId,
        scheduledDate,
      )) as unknown as HouseChecklist[];
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
