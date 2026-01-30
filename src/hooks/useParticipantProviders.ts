import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ParticipantProvider {
  id: string;
  participant_id: string;
  provider_name: string;
  provider_type?: string;
  provider_description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useParticipantProviders(participantId?: string) {
  const [providers, setProviders] = useState<ParticipantProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participantId) {
      fetchProviders(participantId);
    } else {
      setLoading(false);
    }
  }, [participantId]);

  const fetchProviders = async (participantId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('participant_providers')
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProviders(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch providers';
      console.error('Error fetching providers:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function addProvider(provider: Omit<ParticipantProvider, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('participant_providers')
        .insert(provider)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProviders([data, ...providers]);
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add provider';
      console.error('Error adding provider:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateProvider(id: string, updates: Partial<ParticipantProvider>) {
    try {
      const { data, error } = await supabase
        .from('participant_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProviders(providers.map(p => p.id === id ? data : p));
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update provider';
      console.error('Error updating provider:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteProvider(id: string) {
    try {
      const { error } = await supabase
        .from('participant_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProviders(providers.filter(p => p.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete provider';
      console.error('Error deleting provider:', err);
      return { error: errorMessage };
    }
  }

  return {
    providers,
    loading,
    error,
    addProvider,
    updateProvider,
    deleteProvider,
    refetch: participantId ? () => fetchProviders(participantId) : () => {}
  };
}
