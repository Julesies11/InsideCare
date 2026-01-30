import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ParticipantFunding {
  id: string;
  participant_id: string;
  house_id?: string;
  funding_source: 'NDIS' | 'Private' | 'State Funding';
  funding_type: 'Core Supports' | 'Capacity Building' | 'Capital Supports' | 'Support Services';
  registration_number: string;
  invoice_recipient: string;
  allocated_amount: number;
  used_amount: number;
  remaining_amount: number;
  status: 'Active' | 'Near Depletion' | 'Expired' | 'Inactive';
  expiry_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  participant?: {
    id: string;
    name: string;
  };
  house?: {
    id: string;
    name: string;
  };
}

export function useFunding(participantId?: string) {
  const [fundingRecords, setFundingRecords] = useState<ParticipantFunding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFunding();
  }, [participantId]);

  async function fetchFunding() {
    try {
      setLoading(true);

      let query = supabase
        .from('participant_funding')
        .select(
          `
          id,
          participant_id,
          house_id,
          funding_source,
          funding_type,
          registration_number,
          invoice_recipient,
          allocated_amount,
          used_amount,
          remaining_amount,
          status,
          expiry_date,
          notes,
          created_at,
          updated_at,
          participant:participants(id, name),
          house:houses(id, name)
          `
        )
        .order('created_at', { ascending: false });

      // Filter by participant if specified
      if (participantId) {
        query = query.eq('participant_id', participantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = (data || []).map((record: any) => ({
        ...record,
        participant: record.participant?.[0],
        house: record.house?.[0],
      }));
      setFundingRecords(formattedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch funding records';
      console.error('Error fetching funding records:', err);
      setError(errorMessage);
      setFundingRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function addFunding(newFunding: Omit<ParticipantFunding, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('participant_funding')
        .insert([newFunding])
        .select()
        .single();

      if (error) throw error;

      setFundingRecords([data, ...fundingRecords]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add funding record';
      console.error('Error adding funding record:', err);
      throw new Error(errorMessage);
    }
  }

  async function updateFunding(id: string, updates: Partial<ParticipantFunding>) {
    try {
      const { data, error } = await supabase
        .from('participant_funding')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFundingRecords(fundingRecords.map(f => f.id === id ? data : f));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update funding record';
      console.error('Error updating funding record:', err);
      throw new Error(errorMessage);
    }
  }

  async function deleteFunding(id: string) {
    try {
      const { error } = await supabase
        .from('participant_funding')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFundingRecords(fundingRecords.filter(f => f.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete funding record';
      console.error('Error deleting funding record:', err);
      throw new Error(errorMessage);
    }
  }

  const refetch = () => {
    fetchFunding();
  };

  return {
    fundingRecords,
    loading,
    error,
    addFunding,
    updateFunding,
    deleteFunding,
    refetch,
  };
}
