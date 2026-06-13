import { systemApi } from '@/api/system.api';
import { Database } from '@/models/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export type RoleRow = Database['public']['Tables']['ic_roles']['Row'];

export interface Role extends RoleRow {
  assigned_count?: number;
  staff?: Array<{ id: string; staff_name: string; photo_url: string | null }>;
}

export function useRoles() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ROLES],
    queryFn: async () => {
      const data = await systemApi.roles.list();
      return data as Role[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    ...query,
    roles: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}

export function useAddRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      roleData: Database['public']['Tables']['ic_roles']['Insert'],
    ) => {
      const data = await systemApi.roles.create(roleData);
      return data as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLES] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Database['public']['Tables']['ic_roles']['Update'];
    }) => {
      const data = await systemApi.roles.update(id, updates);
      return data as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLES] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await systemApi.roles.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLES] });
    },
  });
}
