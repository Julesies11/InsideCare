import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ParticipantMedication {
  id: string;
  participant_id: string;
  medication_id: string;
  medication?: {
    id: string;
    name: string;
    category?: string;
    common_dosages?: string;
  };
  dosage?: string;
  frequency?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useParticipantMedications(participantId?: string) {
  const [medications, setMedications] = useState<ParticipantMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participantId) {
      fetchMedications(participantId);
    } else {
      setLoading(false);
    }
  }, [participantId]);

  const fetchMedications = async (participantId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('participant_medications')
        .select(`
          *,
          medication:medications_master(
            id,
            name,
            category,
            common_dosages
          )
        `)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        medication: Array.isArray(item.medication) ? item.medication[0] : item.medication
      }));

      setMedications(formattedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medications';
      console.error('Error fetching medications:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function addMedication(medication: Omit<ParticipantMedication, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('participant_medications')
        .insert(medication)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMedications([data, ...medications]);
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add medication';
      console.error('Error adding medication:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateMedication(id: string, updates: Partial<ParticipantMedication>) {
    try {
      const { data, error } = await supabase
        .from('participant_medications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMedications(medications.map(m => m.id === id ? data : m));
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update medication';
      console.error('Error updating medication:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteMedication(id: string) {
    try {
      const { error } = await supabase
        .from('participant_medications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedications(medications.filter(m => m.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete medication';
      console.error('Error deleting medication:', err);
      return { error: errorMessage };
    }
  }

  return {
    medications,
    loading,
    error,
    addMedication,
    updateMedication,
    deleteMedication,
    refetch: participantId ? () => fetchMedications(participantId) : () => {}
  };
}
