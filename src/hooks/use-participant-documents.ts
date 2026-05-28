import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { QUERY_KEYS } from '@/config/query-keys';

export interface ParticipantDocument {
  id: string;
  participant_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at?: string;
  updated_at?: string;
}

const PARTICIPANT_DOCUMENT_COLUMNS = 'id, participant_id, file_name, file_path, file_size, mime_type, created_at, updated_at';

export function useParticipantDocuments(participantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENTS)
        .select(PARTICIPANT_DOCUMENT_COLUMNS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ParticipantDocument[];
    },
    enabled: !!participantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUploadParticipantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, participantId }: { file: File; participantId: string }) => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${participantId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.PARTICIPANT_DOCUMENTS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENTS)
        .insert({
          participant_id: participantId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
        })
        .select(PARTICIPANT_DOCUMENT_COLUMNS)
        .maybeSingle();

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('You do not have permission to upload documents for this participant.');
      }
      return data as ParticipantDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, data.participant_id] });
    },
  });
}

export function useDeleteParticipantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, participantId }: { id: string; filePath: string; participantId: string }) => {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.PARTICIPANT_DOCUMENTS)
        .remove([filePath]);

      if (storageError) {
        throw new Error(`Failed to delete from storage: ${storageError.message}`);
      }

      const { error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, variables.participantId] });
    },
  });
}

export function useUpdateParticipantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, participantId, updates }: { id: string; participantId: string; updates: Partial<ParticipantDocument> }) => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_DOCUMENTS)
        .update(updates)
        .eq('id', id)
        .select(PARTICIPANT_DOCUMENT_COLUMNS)
        .single();

      if (error) throw error;
      return data as ParticipantDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, data.participant_id] });
    },
  });
}

export const getParticipantFileUrl = async (filePath: string, downloadName?: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PARTICIPANT_DOCUMENTS)
    .createSignedUrl(filePath, 3600, {
      download: downloadName || true
    });
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
};
