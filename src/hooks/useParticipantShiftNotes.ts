import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ShiftNote {
  id: string;
  participant_id?: string | null;
  staff_id?: string | null;
  shift_date: string;
  shift_time?: string | null;
  house_id?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  full_note?: string | null;
  attachment_path?: string | null;
  created_at?: string;
  updated_at?: string;
  staff?: {
    id: string;
    name: string;
  } | null;
}

export function useParticipantShiftNotes(participantId?: string) {
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participantId) {
      fetchShiftNotes();
    } else {
      setShiftNotes([]);
      setLoading(false);
    }
  }, [participantId]);

  async function fetchShiftNotes() {
    if (!participantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shift_notes')
        .select(`
          *,
          staff(id, name)
        `)
        .eq('participant_id', participantId)
        .order('shift_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShiftNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching shift notes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addShiftNote(note: Omit<ShiftNote, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('shift_notes')
        .insert([{ ...note, participant_id: participantId }])
        .select(`
          *,
          staff(id, name)
        `)
        .single();

      if (error) throw error;

      setShiftNotes([data, ...shiftNotes]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add shift note';
      console.error('Error adding shift note:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateShiftNote(id: string, updates: Partial<ShiftNote>) {
    try {
      const { data, error } = await supabase
        .from('shift_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          staff(id, name)
        `)
        .single();

      if (error) throw error;

      setShiftNotes(shiftNotes.map(n => n.id === id ? data : n));
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shift note';
      console.error('Error updating shift note:', err);
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

      setShiftNotes(shiftNotes.filter(n => n.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete shift note';
      console.error('Error deleting shift note:', err);
      return { error: errorMessage };
    }
  }

  return {
    shiftNotes,
    loading,
    error,
    addShiftNote,
    updateShiftNote,
    deleteShiftNote,
    refetch: fetchShiftNotes,
  };
}
