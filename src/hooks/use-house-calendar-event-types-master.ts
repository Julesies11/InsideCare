import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { HouseCalendarEventType } from './useHouseCalendarEvents';

const EVENT_TYPE_COLUMNS = 'id, name, description, status, color, created_at, updated_at';

export function useHouseCalendarEventTypesMaster() {
  return useQuery({
    queryKey: ['house-calendar-event-types-master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_calendar_event_types_master')
        .select(EVENT_TYPE_COLUMNS)
        .order('name', { ascending: true });

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
        .from('house_calendar_event_types_master')
        .insert([eventTypeData])
        .select(EVENT_TYPE_COLUMNS)
        .single();

      if (error) throw error;
      return data as HouseCalendarEventType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-calendar-event-types-master'] });
    },
  });
}

export function useUpdateHouseCalendarEventTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HouseCalendarEventType> }) => {
      const { data, error } = await supabase
        .from('house_calendar_event_types_master')
        .update(updates)
        .eq('id', id)
        .select(EVENT_TYPE_COLUMNS)
        .single();

      if (error) throw error;
      return data as HouseCalendarEventType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-calendar-event-types-master'] });
    },
  });
}
