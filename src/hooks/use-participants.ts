import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Participant } from '@/models/participant';

export interface ParticipantsFilter {
  search?: string;
  houses?: string[];
  statuses?: string[];
}

export interface ParticipantsSort {
  id: string;
  desc: boolean;
}

export function useParticipants(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: ParticipantsSort[] = [],
  filters: ParticipantsFilter = {}
) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build base query
      let query = supabase
        .from('participants')
        .select(`
          *,
          houses!house_id (
            name
          )
        `, { count: 'exact' });

      // Apply search filter if present
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,ndis_number.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      // Apply house filter
      if (filters.houses && filters.houses.length > 0) {
        query = query.in('house_id', filters.houses);
      }

      // Apply status filter
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      // Apply sorting
      if (sort.length > 0) {
        sort.forEach(s => {
          query = query.order(s.id, { ascending: !s.desc });
        });
      } else {
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count: totalCount } = await query;

      if (error) throw error;

      // Transform data to include house_name
      const participantsWithHouse = (data || []).map((p: any) => ({
        ...p,
        house_name: p.houses?.name || null,
      }));

      setParticipants(participantsWithHouse);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, JSON.stringify(sort), JSON.stringify(filters)]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

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
      console.error('Error adding participant:', err);
      return { data: null, error: err };
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
      console.error('Error updating participant:', err);
      return { data: null, error: err };
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
      console.error('Error deleting participant:', err);
      return { error: err };
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
