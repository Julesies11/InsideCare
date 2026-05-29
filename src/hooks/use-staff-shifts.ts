import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';

const getShiftsQuery = () => supabase
  .from(TABLES.STAFF_SHIFTS)
  .select(`
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
  `);

export type StaffShiftRow = Awaited<ReturnType<typeof getShiftsQuery>>['data'] extends (infer U)[] ? U : never;
export type ShiftParticipantRow = Database['public']['Tables']['ic_shift_participants']['Row'];

export interface StaffShift extends Omit<StaffShiftRow, 'house'> {
  house?: {
    id: string;
    house_name: string;
  } | null;
  participants?: Array<{
    id: string;
    participant_name: string;
  }>;
  duration_hours?: number;
}

export type ShiftParticipant = ShiftParticipantRow;

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
  const query = useQuery({
    queryKey: ['staff-shifts', { staffId, startDate, endDate }],
    queryFn: async () => {
      if (!staffId) return [];

      let query = supabase
        .from(TABLES.STAFF_SHIFTS)
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
        .from(TABLES.SHIFT_PARTICIPANTS)
        .select(`
          shift_id,
          participant:ic_participants(id, participant_name)
        `)
        .in('shift_id', shiftIds);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
      }

      return (shifts || []).map((shift) => {
        const shiftParticipants = participants
          ?.filter((p) => p.shift_id === shift.id)
          .map((p) => {
            const participantData = (Array.isArray(p.participant) ? p.participant[0] : p.participant);
            return p.participant ? {
              id: participantData.id,
              participant_name: participantData.participant_name,
              name: participantData.participant_name
            } : null;
          })
          .filter((p) => p !== null) || [];

        return {
          ...shift,
          house: Array.isArray(shift.house) ? shift.house[0] : shift.house,
          participants: shiftParticipants as Array<{ id: string; participant_name: string }>,
          duration_hours: calculateDuration(shift.start_time, shift.end_time),
        };
      }) as unknown as StaffShift[];
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
    mutationFn: async (shiftData: Database['public']['Tables']['ic_staff_shifts']['Insert']) => {
      const { data, error } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .insert([shiftData])
        .select(SHIFT_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to create this shift");
      return data as unknown as StaffShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_staff_shifts']['Update'] }) => {
      const { data, error } = await supabase
        .from(TABLES.STAFF_SHIFTS)
        .update(updates)
        .eq('id', id)
        .select(SHIFT_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to edit this shift");
      return data as unknown as StaffShift;
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
        .from(TABLES.STAFF_SHIFTS)
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
  const query = useQuery({
    queryKey: ['shift-participants', shiftId],
    queryFn: async () => {
      if (!shiftId) return [];
      const { data, error } = await supabase
        .from(TABLES.SHIFT_PARTICIPANTS)
        .select(`
          id,
          shift_id,
          participant_id,
          participant:ic_participants(id, participant_name)
        `)
        .eq('shift_id', shiftId);

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        participant: Array.isArray(p.participant) ? p.participant[0] : p.participant
      }));
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
        .from(TABLES.SHIFT_PARTICIPANTS)
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
        .from(TABLES.SHIFT_PARTICIPANTS)
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
