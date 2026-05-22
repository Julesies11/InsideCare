import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export type RoleRow = Database['public']['Tables']['ic_roles']['Row'];

export interface Role extends RoleRow {
  assigned_count?: number;
}

export function useRoles() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ROLES],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.ROLES)
        .select(`
          *,
          staff:ic_staff(count)
        `)
        .order('role_name', { ascending: true });

      if (error) throw error;
      
      // Transform the response to include a flattened assigned_count
      return (data || []).map(role => ({
        ...role,
        assigned_count: (role as any).staff?.[0]?.count || 0
      })) as unknown as Role[];
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
    mutationFn: async (roleData: Database['public']['Tables']['ic_roles']['Insert']) => {
      const { data, error } = await supabase
        .from(TABLES.ROLES)
        .insert([roleData])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error adding role:', error);
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      return data as unknown as Role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLES] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_roles']['Update'] }) => {
      const { data, error } = await supabase
        .from(TABLES.ROLES)
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      return data as unknown as Role;
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
      const { error } = await supabase
        .from(TABLES.ROLES)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLES] });
    },
  });
}
