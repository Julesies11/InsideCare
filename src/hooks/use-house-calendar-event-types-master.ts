import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterListsApi } from '@/api/master-lists.api';
import { QUERY_KEYS } from '@/config/query-keys';
import { HouseCalendarEventType } from './useHouseCalendarEvents';

export function useHouseCalendarEventTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_TYPES_MASTER],
    queryFn: async () => {
      const data = await masterListsApi.eventTypes.list();
      return data as HouseCalendarEventType[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddHouseCalendarEventTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventTypeData: Omit<HouseCalendarEventType, 'id'>) => {
      // (Direct insert for now until API expanded or using existing API)
      return await masterListsApi.eventTypes.upsert(eventTypeData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_TYPES_MASTER] });
    },
  });
}

export function useUpdateHouseCalendarEventTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HouseCalendarEventType> }) => {
      return await masterListsApi.eventTypes.upsert({ ...updates, id } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_TYPES_MASTER] });
    },
  });
}
