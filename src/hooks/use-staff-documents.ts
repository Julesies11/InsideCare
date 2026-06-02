import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { staffDetailsApi } from '@/api/staff-details.api';

export interface StaffDocument {
  id: string;
  staff_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export function useStaffDocuments(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, staffId],
    queryFn: async () => {
      if (!staffId) return [];
      return await staffDetailsApi.documents.list(staffId);
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    documents: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useUploadStaffDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, staffId, uploadedBy }: { file: File; staffId: string; uploadedBy?: string }) => {
      return await staffDetailsApi.documents.upload(staffId, file, uploadedBy);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, data.staff_id] });
    },
  });
}

export function useUpdateStaffDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, staffId, updates }: { id: string; staffId: string; updates: Partial<StaffDocument> }) => {
      return await staffDetailsApi.documents.update(id, updates);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, data.staff_id] });
    },
  });
}

export function useDeleteStaffDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, staffId }: { id: string; filePath: string; staffId: string }) => {
      await staffDetailsApi.documents.delete(id, filePath);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, variables.staffId] });
    },
  });
}

export const getStaffFileUrl = async (filePath: string, downloadName?: string) => {
  return await staffDetailsApi.documents.getAttachmentSignedUrl(filePath, downloadName);
};
