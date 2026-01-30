import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ShiftNote {
  id: string;
  participant_id: string | null;
  staff_id: string | null;
  shift_date: string;
  shift_time: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags: string[] | null;
  full_note: string | null;
  house_id: string | null;
  // Joined fields
  participant_name?: string;
  staff_name?: string;
  house_name?: string;
}

export function useShiftNotes() {
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShiftNotes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shift_notes')
        .select(`
          *,
          participants (name),
          staff (name),
          houses (name)
        `)
        .order('shift_date', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((note: any) => ({
        ...note,
        participant_name: note.participants?.name,
        staff_name: note.staff?.name,
        house_name: note.houses?.name,
      }));

      setShiftNotes(formattedData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShiftNotes();
  }, [fetchShiftNotes]);

  return {
    shiftNotes,
    loading,
    error,
    refetch: fetchShiftNotes,
  };
}
