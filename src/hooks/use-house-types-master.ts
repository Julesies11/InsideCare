import { masterListsApi } from '@/api/master-lists.api';
import { Database } from '@/models/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export type HouseType =
  Database['public']['Tables']['ic_house_types_master']['Row'];

export function useHouseTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.HOUSE_TYPES_MASTER],
    queryFn: async () => {
      return await masterListsApi.houseTypes.list();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddHouseTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      houseTypeData: Database['public']['Tables']['ic_house_types_master']['Insert'],
    ) => {
      return await masterListsApi.houseTypes.create(houseTypeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.HOUSE_TYPES_MASTER],
      });
    },
  });
}

export function useUpdateHouseTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Database['public']['Tables']['ic_house_types_master']['Update'];
    }) => {
      return await masterListsApi.houseTypes.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.HOUSE_TYPES_MASTER],
      });
    },
  });
}
