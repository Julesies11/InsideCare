import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

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

export interface ShiftNoteUpdateData {
  participant_id?: string | null;
  staff_id?: string | null;
  start_date?: string;
  shift_time?: string | null;
  house_id?: string | null;
  shift_id?: string | null;
  notes?: string | null;
  full_note?: string | null;
}

const SHIFT_NOTE_COLUMNS = `
  id, 
  participant_id, 
  staff_id, 
  start_date, 
  shift_time, 
  house_id, 
  shift_id, 
  notes, 
  full_note, 
  created_at, 
  updated_at,
  participant:${TABLES.PARTICIPANTS}(id, participant_name),
  staff:${TABLES.STAFF}!shift_notes_staff_id_fkey(id, staff_name),
  house:${TABLES.HOUSES}(id, house_name),
  shift:${TABLES.STAFF_SHIFTS}(id, start_time, end_time, shift_template)
`;

export function useShiftNotes() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.SHIFT_NOTES],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.SHIFT_NOTES)
        .select(SHIFT_NOTE_COLUMNS)
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Map for legacy support if needed
      return (data || []).map((note: any) => ({
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
    const { data, error } = await supabase
      .from(TABLES.SHIFT_NOTES)
      .select(SHIFT_NOTE_COLUMNS)
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as ShiftNote[];
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
      const { data, error } = await supabase
        .from(TABLES.SHIFT_NOTES)
        .select(SHIFT_NOTE_COLUMNS)
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ShiftNote[];
    },
    enabled: !!shiftId,
  });
}

export function useShiftNotesByParticipantId(participantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SHIFT_NOTES, { participantId }],
    queryFn: async () => {
      if (!participantId) return [];
      const { data, error } = await supabase
        .from(TABLES.SHIFT_NOTES)
        .select(SHIFT_NOTE_COLUMNS)
        .eq('participant_id', participantId)
        .order('start_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((note: any) => ({
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
    mutationFn: async (noteData: ShiftNoteUpdateData) => {
      const { data, error } = await supabase
        .from(TABLES.SHIFT_NOTES)
        .upsert(noteData, { onConflict: 'shift_id,staff_id' })
        .select(SHIFT_NOTE_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to create this shift note");
      return data as ShiftNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });
    },
  });
}

export function useUpdateShiftNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ShiftNoteUpdateData }) => {
      if (!id || id === 'undefined') {
        throw new Error('Shift note ID is required for update');
      }
      const { data, error } = await supabase
        .from(TABLES.SHIFT_NOTES)
        .update(updates)
        .eq('id', id)
        .select(SHIFT_NOTE_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to edit this shift note");
      return data as ShiftNote;
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.SHIFT_NOTES)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });
    },
  });
}
