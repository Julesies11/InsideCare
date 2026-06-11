import { checklistsApi } from '@/api/checklists.api';
import { useQuery } from '@tanstack/react-query';

export interface HouseChecklistEvent {
  id: string;
  house_id: string;
  title: string;
  event_date: string;
  is_checklist_event: boolean;
  is_shift_routine?: boolean;
  shift_id?: string;
  shift_template_id?: string;
  house_checklist_id: string;
  status: string;
  checklist?: {
    id: string;
    house_checklist_name: string;
    description: string;
    items: any[];
  };
  latest_submission?: {
    id: string;
    status: string;
    updated_at: string;
    scheduled_date: string;
  };
}

export function useHouseChecklistEvents(
  houseId?: string,
  date?: string,
  shiftId?: string,
) {
  const query = useQuery({
    queryKey: ['house-checklist-events', houseId, date, shiftId],
    queryFn: async () => {
      if (!houseId || !date) return [];
      return (await checklistsApi.listHouseChecklistEvents(
        houseId,
        date,
        shiftId,
      )) as unknown as HouseChecklistEvent[];
    },
    enabled: !!houseId && !!date,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    events: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
