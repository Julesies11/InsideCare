import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HouseDocument {
  id: string;
  house_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  category?: string;
  version?: string;
  status: string;
  uploaded_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useHouseDocuments(houseId?: string) {
  const [houseDocuments, setHouseDocuments] = useState<HouseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!houseId) {
      setHouseDocuments([]);
      setLoading(false);
      return;
    }

    const fetchHouseDocuments = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('house_files')
          .select('*')
          .eq('house_id', houseId)
          .eq('status', 'current')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setHouseDocuments(data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch house documents';
        console.error('Error fetching house documents:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseDocuments();
  }, [houseId]);

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('house-documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return {
    houseDocuments,
    loading,
    error,
    getFileUrl,
  };
}
