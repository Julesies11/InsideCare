import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HouseResource {
  id: string;
  house_id: string;
  title: string;
  category: string;
  type: string;
  description?: string;
  priority: string;
  phone?: string;
  address?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    email?: string;
  };
}

export function useHouseResources(houseId?: string) {
  const [houseResources, setHouseResources] = useState<HouseResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!houseId) {
      setHouseResources([]);
      setLoading(false);
      return;
    }

    const fetchHouseResources = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('house_resources')
          .select(`
            *,
            creator:staff!created_by(id, name, email)
          `)
          .eq('house_id', houseId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setHouseResources(data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house resources';
        console.error('Error fetching house resources:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseResources();
  }, [houseId]);

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('house-resources')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return {
    houseResources,
    loading,
    error,
    getFileUrl,
  };
}
