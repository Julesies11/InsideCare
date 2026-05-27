import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
      const { data, error } = await supabase
        .from('ic_participant_document_roles')
        .select(`
          id,
          document_id,
          role_id,
          access_level,
          role:ic_roles(id, role_name)
        `)
        .eq('document_id', documentId);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('ic_participant_document_roles')
        .select(`
          id,
          document_id,
          role_id,
          access_level,
          role:ic_roles(id, role_name)
        `)
        .in('document_id', documentIds);

      if (error) throw error;
      return data;
    },
    enabled: documentIds.length > 0,
  });
}

export function useUpdateDocumentRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, roles }: { documentId: string; roles: Array<{ role_id: string; access_level: string }> }) => {
      // 1. Delete existing role permissions for this document
      const { error: deleteError } = await supabase
        .from('ic_participant_document_roles')
        .delete()
        .eq('document_id', documentId);

      if (deleteError) throw deleteError;

      // 2. Insert new role permissions if any
      if (roles.length > 0) {
        const { error: insertError } = await supabase
          .from('ic_participant_document_roles')
          .insert(roles.map(r => ({
            document_id: documentId,
            role_id: r.role_id,
            access_level: r.access_level,
          })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-role-permissions', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['participant-document-overrides'] });
    },
  });
}
