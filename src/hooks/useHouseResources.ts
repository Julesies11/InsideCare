import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { QUERY_KEYS } from '@/config/query-keys';

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
    staff_name: string;
    email?: string;
  };
}

export function useHouseResources(houseId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSE_RESOURCES, houseId],
    queryFn: async () => {
      if (!houseId) return [];
      
      const { data, error } = await supabase
        .from(TABLES.HOUSE_RESOURCES)
        .select(`
          *,
          creator:ic_staff!fk_ic_house_resources_created_by(id, staff_name, email)
        `)
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getFileUrl = async (filePath: string, downloadName?: string) => {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.HOUSE_DOCUMENTS)
      .createSignedUrl(filePath, 3600, {
        download: downloadName || true
      });
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  return {
    houseResources: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    getFileUrl,
    refetch: query.refetch,
  };
}
