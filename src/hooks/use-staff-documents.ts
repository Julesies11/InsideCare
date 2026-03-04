import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StaffDocument {
  id: string;
  staff_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  is_restricted?: boolean;
  created_at?: string;
  updated_at?: string;
}

const STAFF_DOCUMENT_COLUMNS = 'id, staff_id, file_name, file_path, file_size, mime_type, uploaded_by, is_restricted, created_at, updated_at';

export function useStaffDocuments(staffId?: string) {
  const query = useQuery({
    queryKey: ['staff-documents', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase
        .from('staff_documents')
        .select(STAFF_DOCUMENT_COLUMNS)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StaffDocument[];
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
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${staffId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data, error } = await supabase
        .from('staff_documents')
        .insert({
          staff_id: staffId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          uploaded_by: uploadedBy || null
        })
        .select(STAFF_DOCUMENT_COLUMNS)
        .single();

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }
      return data as StaffDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-documents', data.staff_id] });
    },
  });
}

export function useDeleteStaffDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, staffId }: { id: string; filePath: string; staffId: string }) => {
      const { error: storageError } = await supabase.storage
        .from('staff-documents')
        .remove([filePath]);

      if (storageError) {
        throw new Error(`Failed to delete from storage: ${storageError.message}`);
      }

      const { error } = await supabase
        .from('staff_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-documents', variables.staffId] });
    },
  });
}

export const getStaffFileUrl = (filePath: string) => {
  const { data: { publicUrl } } = supabase.storage
    .from('staff-documents')
    .getPublicUrl(filePath);
  return publicUrl;
};
