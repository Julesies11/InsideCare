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
  shift_template: string;
  shift_template_id?: string | null;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  house?: {
    id: string;
    house_name: string;
  };
  participants?: Array<{
    id: string;
    participant_name: string;
  }>;
  duration_hours?: number;
}

export interface ShiftParticipant {
  id: string;
  shift_id: string;
  participant_id: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

const SHIFT_COLUMNS = `
  id,
  staff_id,
  start_date,
  end_date,
  start_time,
  end_time,
  house_id,
  shift_template,
  shift_template_id,
  notes,
  created_by,
  updated_by,
  created_at,
  updated_at,
  house:ic_houses(id, house_name)
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
        .from('ic_staff_shifts')
        .select(SHIFT_COLUMNS)
        .eq('staff_id', staffId)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Handle overlapping date ranges (useful for overnight shifts)
      // Intersection rule: (Shift End >= Range Start) AND (Shift Start <= Range End)
      if (startDate) query = query.gte('end_date', startDate);
      if (endDate) query = query.lte('start_date', endDate);

      const { data: shifts, error: shiftsError } = await query;
      if (shiftsError) throw shiftsError;
      if (!shifts || shifts.length === 0) return [];

      const shiftIds = shifts.map((s) => s.id);
      const { data: participants, error: participantsError } = await supabase
        .from('ic_shift_participants')
        .select(`
          shift_id,
          participant:ic_participants(id, participant_name)
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
            participant_name: p.participant.participant_name
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
    mutationFn: async (shiftData: Omit<StaffShift, 'id' | 'created_at' | 'updated_at' | 'house' | 'participants' | 'duration_hours' | 'created_by' | 'updated_by'>) => {
      const { data, error } = await supabase
        .from('ic_staff_shifts')
        .insert([shiftData])
        .select(SHIFT_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to create this shift");
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
        .from('ic_staff_shifts')
        .update(updates)
        .eq('id', id)
        .select(SHIFT_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to edit this shift");
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
        .from('ic_staff_shifts')
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
        .from('ic_shift_participants')
        .select(`
          id,
          shift_id,
          participant_id,
          participant:ic_participants(id, participant_name)
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
        .from('ic_shift_participants')
        .insert([{ shift_id: shiftId, participant_id: participantId }])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to add a participant to this shift");
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
        .from('ic_shift_participants')
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
