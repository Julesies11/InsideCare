import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { houseOperationsApi } from '@/api/house-operations.api';

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
      return await houseOperationsApi.resources.list(houseId);
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getFileUrl = async (filePath: string, downloadName?: string) => {
    try {
      return await houseOperationsApi.files.getAttachmentSignedUrl(filePath, downloadName);
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  };

  return {
    houseResources: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    getFileUrl,
    refetch: query.refetch,
  };
}
