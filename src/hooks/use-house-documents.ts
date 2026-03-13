import { useQuery } from '@tanstack/react-query';
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

const HOUSE_DOCUMENT_COLUMNS = 'id, house_id, file_name, file_path, file_size, file_type, category, version, status, uploaded_by, notes, created_at, updated_at';

export function useHouseDocuments(houseId?: string) {
  const query = useQuery({
    queryKey: ['house-documents', houseId],
    queryFn: async () => {
      if (!houseId) return [];

      const { data, error } = await supabase
        .from('house_files')
        .select(HOUSE_DOCUMENT_COLUMNS)
        .eq('house_id', houseId)
        .eq('status', 'current')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HouseDocument[];
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    documents: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}

export const getHouseFileUrl = (filePath: string) => {
  const { data } = supabase.storage
    .from('house-documents')
    .getPublicUrl(filePath);
  return data.publicUrl;
};
