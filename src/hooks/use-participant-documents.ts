import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { participantDetailsApi } from '@/api/participant-details.api';

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

export function useParticipantDocuments(participantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, participantId],
    queryFn: async () => {
      if (!participantId) return [];
      return await participantDetailsApi.documents.list(participantId);
    },
    enabled: !!participantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUploadParticipantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, participantId }: { file: File; participantId: string }) => {
      return await participantDetailsApi.documents.upload(participantId, file);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, data.participant_id] });
    },
  });
}

export function useDeleteParticipantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, participantId }: { id: string; filePath: string; participantId: string }) => {
      await participantDetailsApi.documents.delete(id, filePath);
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
      return await participantDetailsApi.documents.update(id, updates);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_DOCUMENTS, data.participant_id] });
    },
  });
}

export const getParticipantFileUrl = async (filePath: string, downloadName?: string) => {
  return await participantDetailsApi.documents.getAttachmentSignedUrl(filePath, downloadName);
};
