import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

export function useShiftNotes() {
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShiftNotes();
  }, []);

  async function fetchShiftNotes(silent = false) {
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('shift_notes')
        .select(`
          *,
          participant:participants(id, name),
          staff(id, name),
          house:houses(id, name),
          shift:staff_shifts(id, start_time, end_time, shift_type, status)
        `)
        .order('shift_date', { ascending: false });

      if (error) throw error;

      setShiftNotes(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shift notes';
      console.error('Error fetching shift notes:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function updateShiftNote(id: string, updates: ShiftNoteUpdateData) {
    try {
      const { data, error } = await supabase
        .from('shift_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          participant:participants(id, name),
          staff(id, name),
          house:houses(id, name),
          shift:staff_shifts(id, start_time, end_time, shift_type, status)
        `)
        .single();

      if (error) throw error;

      setShiftNotes(shiftNotes.map(note => note.id === id ? data : note));
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shift note';
      console.error('Error updating shift note:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function createShiftNote(noteData: ShiftNoteUpdateData) {
    try {
      const { data, error } = await supabase
        .from('shift_notes')
        .insert([{
          ...noteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(`
          *,
          participant:participants(id, name),
          staff(id, name),
          house:houses(id, name),
          shift:staff_shifts(id, start_time, end_time, shift_type, status)
        `)
        .single();

      if (error) throw error;

      setShiftNotes([data, ...shiftNotes]);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create shift note';
      console.error('Error creating shift note:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteShiftNote(id: string) {
    try {
      const { error } = await supabase
        .from('shift_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShiftNotes(shiftNotes.filter(note => note.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete shift note';
      console.error('Error deleting shift note:', err);
      return { error: errorMessage };
    }
  }

  async function fetchShiftNotesByShiftId(shiftId: string): Promise<ShiftNote[]> {
    try {
      const { data, error } = await supabase
        .from('shift_notes')
        .select(`
          *,
          participant:participants(id, name),
          staff(id, name),
          house:houses(id, name),
          shift:staff_shifts(id, start_time, end_time, shift_type, status)
        `)
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching shift notes by shift id:', err);
      return [];
    }
  }

  return {
    shiftNotes,
    loading,
    error,
    createShiftNote,
    updateShiftNote,
    deleteShiftNote,
    fetchShiftNotesByShiftId,
    refetch: fetchShiftNotes,
  };
}
