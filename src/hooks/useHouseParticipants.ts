import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HouseParticipant {
  id: string;
  name: string;
  email?: string;
  status: string;
  house_id?: string;
  house_phone?: string;
  personal_mobile?: string;
  created_at: string;
  updated_at: string;
}

export function useHouseParticipants(houseId?: string) {
  const [houseParticipants, setHouseParticipants] = useState<HouseParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!houseId) {
      setHouseParticipants([]);
      setLoading(false);
      return;
    }

    const fetchHouseParticipants = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('participants')
          .select(`
            id,
            name,
            email,
            status,
            house_id,
            house_phone,
            personal_mobile,
            created_at,
            updated_at
          `)
          .eq('house_id', houseId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setHouseParticipants(data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house participants';
        console.error('Error fetching house participants:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseParticipants();
  }, [houseId]);

  return {
    houseParticipants,
    loading,
    error,
  };
}
