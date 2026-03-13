import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';

export interface ShiftNote {
  id: string;
  participant_id?: string | null;
  staff_id?: string | null;
  shift_date: string;
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
    name: string;
  } | null;
  staff?: {
    id: string;
    name: string;
  } | null;
  house?: {
    id: string;
    name: string;
  } | null;
  shift?: {
    id: string;
    start_time: string;
    end_time: string;
    shift_type: string;
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
  shift_date?: string;
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
  shift_date, 
  shift_time, 
  house_id, 
  shift_id, 
  notes, 
  full_note, 
  created_at, 
  updated_at,
  participant:participants(id, name),
  staff:staff(id, name),
  house:houses(id, name),
  shift:staff_shifts(id, start_time, end_time, shift_type, status)
`;

export function useShiftNotes() {
  const query = useQuery({
    queryKey: ['shift-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_notes')
        .select(SHIFT_NOTE_COLUMNS)
        .order('shift_date', { ascending: false });

      if (error) throw error;

      // Map for legacy support if needed
      return (data || []).map((note: any) => ({
        ...note,
        participant_name: note.participant?.name,
        staff_name: note.staff?.name,
        house_name: note.house?.name,
      })) as ShiftNote[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { mutateAsync: createShiftNote } = useCreateShiftNote();
  const { mutateAsync: updateShiftNote } = useUpdateShiftNote();
  const { mutateAsync: deleteShiftNote } = useDeleteShiftNote();

  const fetchShiftNotesByShiftId = useCallback(async (shiftId: string) => {
    const { data, error } = await supabase
      .from('shift_notes')
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
    queryKey: ['shift-notes', { shiftId }],
    queryFn: async () => {
      if (!shiftId) return [];
      const { data, error } = await supabase
        .from('shift_notes')
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
    queryKey: ['shift-notes', { participantId }],
    queryFn: async () => {
      if (!participantId) return [];
      const { data, error } = await supabase
        .from('shift_notes')
        .select(SHIFT_NOTE_COLUMNS)
        .eq('participant_id', participantId)
        .order('shift_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((note: any) => ({
        ...note,
        participant_name: note.participant?.name,
        staff_name: note.staff?.name,
        house_name: note.house?.name,
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
        .from('shift_notes')
        .insert([{
          ...noteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(SHIFT_NOTE_COLUMNS)
        .single();

      if (error) throw error;
      return data as ShiftNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-notes'] });
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
        .from('shift_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(SHIFT_NOTE_COLUMNS)
        .single();

      if (error) throw error;
      return data as ShiftNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shift-notes'] });
      if (data.shift_id) {
        queryClient.invalidateQueries({ queryKey: ['shift-notes', { shiftId: data.shift_id }] });
      }
    },
  });
}

export function useDeleteShiftNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shift_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-notes'] });
    },
  });
}
