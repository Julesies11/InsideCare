import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Participant } from '@/models/participant';

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('participants')
        .select(`
          *,
          houses!house_id (
            name
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      // Transform data to include house_name
      const participantsWithHouse = (data || []).map((p: any) => ({
        ...p,
        house_name: p.houses?.name || null,
      }));

      setParticipants(participantsWithHouse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addParticipant(participant: Omit<Participant, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('participants')
        .insert([participant])
        .select()
        .single();

      if (error) throw error;

      setParticipants(prevParticipants => [...prevParticipants, data]);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add participant';
      console.error('Error adding participant:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateParticipant(id: string, updates: Partial<Participant>) {
    try {
      const { data, error } = await supabase
        .from('participants')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          houses!house_id (
            name
          )
        `)
        .single();

      if (error) throw error;

      // Transform data to include house_name
      const participantWithHouse = {
        ...data,
        house_name: (data as any).houses?.name || null,
      };

      setParticipants(prevParticipants => prevParticipants.map(p => p.id === id ? participantWithHouse : p));
      return { data: participantWithHouse, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update participant';
      console.error('Error updating participant:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteParticipant(id: string) {
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setParticipants(prevParticipants => prevParticipants.filter(p => p.id !== id));
      
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete participant';
      console.error('Error deleting participant:', err);
      return { error: errorMessage };
    }
  }

  return {
    participants,
    count: participants.length,
    loading,
    error,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    refetch: fetchParticipants,
  };
}
