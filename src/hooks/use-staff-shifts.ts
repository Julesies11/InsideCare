import { rosterApi } from '@/api/roster.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  notes: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
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

export const calculateDuration = (
  startTime: string,
  endTime: string,
): number => {
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

export function useStaffShifts(
  staffId?: string,
  startDate?: string,
  endDate?: string,
) {
  const query = useQuery({
    queryKey: ['staff-shifts', { staffId, startDate, endDate }],
    queryFn: async () => {
      if (!staffId) return [];

      const shifts = await rosterApi.listShifts({
        staffId,
        startDate,
        endDate,
      });

      return (shifts || []).map((shift: any) => {
        // Map participants from the structure returned by rosterApi (SHIFT_DETAIL view)
        const participants =
          (shift.participants || [])
            ?.map((p: any) => {
              const part = p.participant || p;
              return {
                id: part.id,
                participant_name: part.participant_name,
                name: part.participant_name,
              };
            })
            .filter((p: any) => p.id && p.participant_name) || [];

        return {
          ...shift,
          house: shift.house_info || shift.house,
          participants,
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
    mutationFn: (shiftData: any) => rosterApi.createShift(shiftData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      rosterApi.updateShift(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
    },
  });

  return {
    ...mutation,
    mutateAsync: (id: string, updates: any) =>
      mutation.mutateAsync({ id, updates }),
  };
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rosterApi.deleteShift(id),
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
      const shift = await rosterApi.getShift(shiftId);
      if (!shift) return [];

      return (shift.participants || []).map((p: any) => {
        const part = p.participant || p;
        return {
          ...p,
          participant: part,
        };
      });
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

  const mutation = useMutation({
    mutationFn: ({
      shiftId,
      participantId,
    }: {
      shiftId: string;
      participantId: string;
    }) => rosterApi.addShiftParticipant(shiftId, participantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['shift-participants', variables.shiftId],
      });
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  return {
    ...mutation,
    mutateAsync: (shiftId: string, participantId: string) =>
      mutation.mutateAsync({ shiftId, participantId }),
  };
}

export function useRemoveShiftParticipant() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      shiftId,
      participantId,
    }: {
      shiftId: string;
      participantId: string;
    }) => rosterApi.removeShiftParticipant(shiftId, participantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['shift-participants', variables.shiftId],
      });
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['roster-shifts'] });
    },
  });

  return {
    ...mutation,
    mutateAsync: (shiftId: string, participantId: string) =>
      mutation.mutateAsync({ shiftId, participantId }),
  };
}
