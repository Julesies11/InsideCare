import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StaffShift {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  house_id: string | null;
  shift_type: string;
  shift_type_id?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  house?: {
    id: string;
    name: string;
  };
  participants?: Array<{
    id: string;
    name: string;
  }>;
  duration_hours?: number;
}

export interface ShiftParticipant {
  id: string;
  shift_id: string;
  participant_id: string;
  created_at?: string;
}

const SHIFT_COLUMNS = `
  id,
  staff_id,
  start_date,
  end_date,
  start_time,
  end_time,
  house_id,
  shift_type,
  shift_type_id,
  notes,
  created_at,
  updated_at,
  house:houses(id, name)
`;

export const calculateDuration = (startTime: string, endTime: string): number => {
  try {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const durationMinutes = endMinutes - startMinutes;
    return Math.round((durationMinutes / 60) * 10) / 10;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

export function useStaffShifts(staffId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['staff-shifts', { staffId, startDate, endDate }],
    queryFn: async () => {
      if (!staffId) return [];

      let query = supabase
        .from('staff_shifts')
        .select(SHIFT_COLUMNS)
        .eq('staff_id', staffId)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (startDate) query = query.gte('start_date', startDate);
      if (endDate) query = query.lte('start_date', endDate);

      const { data: shifts, error: shiftsError } = await query;
      if (shiftsError) throw shiftsError;
      if (!shifts || shifts.length === 0) return [];

      const shiftIds = shifts.map((s) => s.id);
      const { data: participants, error: participantsError } = await supabase
        .from('shift_participants')
        .select(`
          shift_id,
          participant:participants(id, name)
        `)
        .in('shift_id', shiftIds);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
      }

      return shifts.map((shift) => {
        const shiftParticipants = participants
          ?.filter((p) => p.shift_id === shift.id)
          .map((p) => p.participant ? {
            id: p.participant.id,
            name: p.participant.name
          } : null)
          .filter((p) => p !== null) || [];

        return {
          ...shift,
          participants: shiftParticipants,
          duration_hours: calculateDuration(shift.start_time, shift.end_time),
        };
      }) as StaffShift[];
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    shifts: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftData: Omit<StaffShift, 'id' | 'created_at' | 'updated_at' | 'house' | 'participants' | 'duration_hours'>) => {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert([shiftData])
        .select(SHIFT_COLUMNS)
        .single();

      if (error) throw error;
      return data as StaffShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StaffShift> }) => {
      const { data, error } = await supabase
        .from('staff_shifts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(SHIFT_COLUMNS)
        .single();

      if (error) throw error;
      return data as StaffShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });
}

export function useShiftParticipants(shiftId?: string) {
  return useQuery({
    queryKey: ['shift-participants', shiftId],
    queryFn: async () => {
      if (!shiftId) return [];
      const { data, error } = await supabase
        .from('shift_participants')
        .select(`
          id,
          shift_id,
          participant_id,
          participant:participants(id, name)
        `)
        .eq('shift_id', shiftId);

      if (error) throw error;
      return data;
    },
    enabled: !!shiftId,
  });

  return {
    ...query,
    participants: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useAddShiftParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, participantId }: { shiftId: string; participantId: string }) => {
      const { data, error } = await supabase
        .from('shift_participants')
        .insert([{ shift_id: shiftId, participant_id: participantId }])
        .select()
        .single();

      if (error) throw error;
      return data as ShiftParticipant;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-participants', variables.shiftId] });
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });
}

export function useRemoveShiftParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, participantId }: { shiftId: string; participantId: string }) => {
      const { error } = await supabase
        .from('shift_participants')
        .delete()
        .eq('shift_id', shiftId)
        .eq('participant_id', participantId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-participants', variables.shiftId] });
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });
}
