import { housesApi, HousesFilter, HousesSort } from '@/api/houses.api';
import { Database } from '@/models/database.types';
import { House } from '@/models/house';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

// Re-export types for backward compatibility
export type { HousesFilter, HousesSort };

export type HouseUIData = House;

export function useHouses(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: HousesSort[] = [],
  filters: HousesFilter = {},
  branchId?: string,
) {
  const query = useQuery({
    queryKey: [
      QUERY_KEYS.HOUSES,
      { pageIndex, pageSize, sort, filters, branchId },
    ],
    queryFn: () =>
      housesApi.list({ pageIndex, pageSize, sort, filters, branchId }),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    ...query,
    houses: (query.data?.data || []) as unknown as HouseUIData[],
    count: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}

export function useActiveHouses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [QUERY_KEYS.HOUSES, 'active'],
    queryFn: () => housesApi.listActive(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

export function useHousesLightweight() {
  return useQuery({
    queryKey: [QUERY_KEYS.HOUSES, 'lightweight'],
    queryFn: () => housesApi.listLightweight(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAddHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      house: Database['public']['Tables']['ic_houses']['Insert'],
    ) => {
      return await housesApi.create(house);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
    },
  });
}

export function useUpdateHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Database['public']['Tables']['ic_houses']['Update'];
    }) => {
      return await housesApi.update(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES, data.id] });
    },
  });
}

export function useDeleteHouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      house_name?: string;
    }) => {
      await housesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
    },
  });
}
