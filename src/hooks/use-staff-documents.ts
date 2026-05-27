import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { QUERY_KEYS } from '@/config/query-keys';

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

const STAFF_DOCUMENT_COLUMNS = 'id, staff_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at, updated_at';

export function useStaffDocuments(staffId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
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
      const filePath = `${staffId}/documents/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .insert({
          staff_id: staffId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          uploaded_by: uploadedBy || null
        })
        .select(STAFF_DOCUMENT_COLUMNS)
        .maybeSingle();

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('You do not have permission to upload documents for this staff member.');
      }
      return data as StaffDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, data.staff_id] });
    },
  });
}

export function useUpdateStaffDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, staffId, updates }: { id: string; staffId: string; updates: Partial<StaffDocument> }) => {
      const { data, error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .update(updates)
        .eq('id', id)
        .select(STAFF_DOCUMENT_COLUMNS)
        .single();

      if (error) throw error;
      return data as StaffDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, data.staff_id] });
    },
  });
}

export function useDeleteStaffDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, staffId }: { id: string; filePath: string; staffId: string }) => {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
        .remove([filePath]);

      if (storageError) {
        throw new Error(`Failed to delete from storage: ${storageError.message}`);
      }

      const { error } = await supabase
        .from(TABLES.STAFF_DOCUMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STAFF_DOCUMENTS, variables.staffId] });
    },
  });
}

export const getStaffFileUrl = async (filePath: string, downloadName?: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.STAFF_DOCUMENTS)
    .createSignedUrl(filePath, 3600, {
      download: downloadName || true
    });
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
};
