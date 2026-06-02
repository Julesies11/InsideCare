import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { QUERY_KEYS } from '@/config/query-keys';
import { shiftNotesApi, ShiftNoteUpdateData } from '@/api/shift-notes.api';

export interface ShiftNote {
  id: string;
  participant_id?: string | null;
  staff_id?: string | null;
  start_date: string;
  shift_time?: string | null;
  house_id?: string | null;
  shift_id?: string | null;
  notes?: string | null;
  full_note?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined data
  participant?: {
    id: string;
    participant_name: string;
  } | null;
  staff?: {
    id: string;
    staff_name: string;
  } | null;
  house?: {
    id: string;
    house_name: string;
  } | null;
  shift?: {
    id: string;
    start_time: string;
    end_time: string;
    shift_template: string;
    status: string;
  } | null;
  // Legacy aliases
  participant_name?: string;
  staff_name?: string;
  house_name?: string;
}

export function useShiftNotes() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.SHIFT_NOTES],
    queryFn: async () => {
      const data = await shiftNotesApi.list();

      // Map for legacy support if needed
      return data.map((note: any) => ({
        ...note,
        participant_name: note.participant?.participant_name,
        staff_name: note.staff?.staff_name,
        house_name: note.house?.house_name,
      })) as ShiftNote[];
    },
    staleTime: 0, // Ensure real-time RLS enforcement
  });

  const { mutateAsync: createShiftNote } = useCreateShiftNote();
  const { mutateAsync: updateShiftNote } = useUpdateShiftNote();
  const { mutateAsync: deleteShiftNote } = useDeleteShiftNote();

  const fetchShiftNotesByShiftId = useCallback(async (shiftId: string) => {
    return await shiftNotesApi.getByShiftId(shiftId) as unknown as ShiftNote[];
  }, []);

  return {
    ...query,
    shiftNotes: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    createShiftNote,
    updateShiftNote,
    deleteShiftNote,
    fetchShiftNotesByShiftId,
    refetch: query.refetch,
  };
}

export function useShiftNotesByShiftId(shiftId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SHIFT_NOTES, { shiftId }],
    queryFn: async () => {
      if (!shiftId) return [];
      return await shiftNotesApi.getByShiftId(shiftId) as unknown as ShiftNote[];
    },
    enabled: !!shiftId,
  });
}

export function useShiftNotesByParticipantId(participantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SHIFT_NOTES, { participantId }],
    queryFn: async () => {
      if (!participantId) return [];
      const data = await shiftNotesApi.getByParticipantId(participantId);

      return data.map((note: any) => ({
        ...note,
        participant_name: note.participant?.participant_name,
        staff_name: note.staff?.staff_name,
        house_name: note.house?.house_name,
      })) as ShiftNote[];
    },
    enabled: !!participantId,
  });
}

export function useCreateShiftNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteData: ShiftNoteUpdateData) => shiftNotesApi.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });
    },
  });
}

export function useUpdateShiftNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ShiftNoteUpdateData }) => {
      if (!id || id === 'undefined') {
        throw new Error('Shift note ID is required for update');
      }
      return shiftNotesApi.update(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });
      if (data.shift_id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES, { shiftId: data.shift_id }] });
      }
    },
  });
}

export function useDeleteShiftNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shiftNotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });
    },
  });
}

