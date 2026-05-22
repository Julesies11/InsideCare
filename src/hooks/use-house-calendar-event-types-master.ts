import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { HouseCalendarEventType } from './useHouseCalendarEvents';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

const EVENT_TYPE_COLUMNS = 'id, event_type_name, description, status, color, created_at, updated_at';

export function useHouseCalendarEventTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_TYPES_MASTER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER)
        .select(EVENT_TYPE_COLUMNS)
        .order('event_type_name', { ascending: true });

      if (error) throw error;
      return data as HouseCalendarEventType[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddHouseCalendarEventTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventTypeData: Omit<HouseCalendarEventType, 'id'>) => {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER)
        .insert([eventTypeData])
        .select(EVENT_TYPE_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to add this event type, or it does not exist.');
      }
      return data as HouseCalendarEventType;
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
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER)
        .update(updates)
        .eq('id', id)
        .select(EVENT_TYPE_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this event type, or it does not exist.');
      }
      return data as HouseCalendarEventType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_TYPES_MASTER] });
    },
  });
}
