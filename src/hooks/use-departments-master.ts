import { masterListsApi } from '@/api/master-lists.api';
import { Database } from '@/models/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export type Department = Database['public']['Tables']['ic_departments']['Row'];

export function useDepartmentsMaster() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.DEPARTMENTS_MASTER],
    queryFn: () => masterListsApi.departments.list(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    ...query,
    departments: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}

export function useAddDepartmentMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      departmentData: Database['public']['Tables']['ic_departments']['Insert'],
    ) => masterListsApi.departments.create(departmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEPARTMENTS_MASTER],
      });
    },
  });
}

export function useUpdateDepartmentMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Database['public']['Tables']['ic_departments']['Update'];
    }) => masterListsApi.departments.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEPARTMENTS_MASTER],
      });
    },
  });
}
