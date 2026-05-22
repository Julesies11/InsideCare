import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ParticipantDocument {
  id: string;
  participant_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  is_restricted?: boolean;
  created_at?: string;
  updated_at?: string;
}

const PARTICIPANT_DOCUMENT_COLUMNS = 'id, participant_id, file_name, file_path, file_size, mime_type, uploaded_by, is_restricted, created_at, updated_at';

export function useParticipantDocuments(participantId?: string) {
  return useQuery({
    queryKey: ['participant-documents', participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const { data, error } = await supabase
        .from('ic_participant_documents')
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
    mutationFn: async ({ file, participantId, uploadedBy }: { file: File; participantId: string; uploadedBy?: string }) => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${participantId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ic_participant-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data, error } = await supabase
        .from('ic_participant_documents')
        .insert({
          participant_id: participantId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          uploaded_by: uploadedBy || null
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
      queryClient.invalidateQueries({ queryKey: ['participant-documents', data.participant_id] });
    },
  });
}

export function useDeleteParticipantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, participantId }: { id: string; filePath: string; participantId: string }) => {
      const { error: storageError } = await supabase.storage
        .from('ic_participant-documents')
        .remove([filePath]);

      if (storageError) {
        throw new Error(`Failed to delete from storage: ${storageError.message}`);
      }

      const { error } = await supabase
        .from('ic_participant_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['participant-documents', variables.participantId] });
    },
  });
}

export const getParticipantFileUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('ic_participant-documents')
    .createSignedUrl(filePath, 3600);
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
};
