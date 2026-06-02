import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/api/system.api';

export interface StaffDocumentRolePermission {
  id: string;
  document_id: string;
  role_id: string;
  access_level: 'full' | 'context_read_write' | 'context_read_only' | 'read_only' | 'none';
  created_at?: string;
  updated_at?: string;
}

export function useStaffDocumentRolePermissions(documentId?: string) {
  return useQuery({
    queryKey: ['staff-document-role-permissions', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      return await systemApi.permissions.listStaffDocumentPermissions(documentId);
    },
    enabled: !!documentId,
  });
}

export function useAllStaffDocumentOverrides(documentIds: string[]) {
  return useQuery({
    queryKey: ['staff-document-overrides', documentIds],
    queryFn: async () => {
      if (!documentIds.length) return [];
      return await systemApi.permissions.listMultipleStaffDocumentPermissions(documentIds);
    },
    enabled: documentIds.length > 0,
  });
}

export function useUpdateStaffDocumentRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, roles }: { documentId: string; roles: Array<{ role_id: string; access_level: string }> }) => {
      await systemApi.permissions.updateStaffDocumentPermissions(documentId, roles);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-document-role-permissions', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['staff-document-overrides'] });
    },
  });
}
