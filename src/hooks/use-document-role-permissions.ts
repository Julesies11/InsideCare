import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantDetailsApi } from '@/api/participant-details.api';

export interface DocumentRolePermission {
  id: string;
  document_id: string;
  role_id: string;
  access_level: 'full' | 'context_read_write' | 'context_read_only' | 'read_only' | 'none';
  created_at?: string;
  updated_at?: string;
}

export function useDocumentRolePermissions(documentId?: string) {
  return useQuery({
    queryKey: ['document-role-permissions', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const data = await participantDetailsApi.documents.listRolePermissions(documentId);
      return data;
    },
    enabled: !!documentId,
  });
}

export function useAllParticipantDocumentOverrides(documentIds: string[]) {
  return useQuery({
    queryKey: ['participant-document-overrides', documentIds],
    queryFn: async () => {
      if (!documentIds.length) return [];
      const data = await participantDetailsApi.documents.listMultipleRolePermissions(documentIds);
      return data;
    },
    enabled: documentIds.length > 0,
  });
}

export function useUpdateDocumentRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, roles }: { documentId: string; roles: Array<{ role_id: string; access_level: string }> }) => {
      await participantDetailsApi.documents.updateRolePermissions(documentId, roles);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-role-permissions', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['participant-document-overrides'] });
    },
  });
}
