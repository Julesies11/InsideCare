import { masterListsApi } from '@/api/master-lists.api';
import { Database } from '@/models/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export type EmploymentType =
  Database['public']['Tables']['ic_employment_types_master']['Row'];

export function useEmploymentTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.EMPLOYMENT_TYPES_MASTER],
    queryFn: () => masterListsApi.employmentTypes.list(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddEmploymentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      employmentTypeData: Database['public']['Tables']['ic_employment_types_master']['Insert'],
    ) => masterListsApi.employmentTypes.create(employmentTypeData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EMPLOYMENT_TYPES_MASTER],
      });
    },
  });
}

export function useUpdateEmploymentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Database['public']['Tables']['ic_employment_types_master']['Update'];
    }) => masterListsApi.employmentTypes.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EMPLOYMENT_TYPES_MASTER],
      });
    },
  });
}
