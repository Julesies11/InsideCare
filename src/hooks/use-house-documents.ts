import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { houseOperationsApi } from '@/api/house-operations.api';

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
  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSE_DOCUMENTS, houseId],
    queryFn: async () => {
      if (!houseId) return [];

      const data = await houseOperationsApi.files.list(houseId);
      return data.filter((f: any) => f.status === 'current') as HouseDocument[];
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

export const getHouseFileUrl = async (filePath: string, downloadName?: string | boolean) => {
  try {
    return await houseOperationsApi.files.getAttachmentSignedUrl(filePath, downloadName);
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
};
