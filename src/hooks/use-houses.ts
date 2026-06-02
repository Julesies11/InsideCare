import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { housesApi, HousesFilter, HousesSort } from '@/api/houses.api';
import { useLogActivity } from '@/hooks/use-activity-log';
import { Database } from '@/models/database.types';
import { QUERY_KEYS } from '@/config/query-keys';

// Re-export types for backward compatibility
export type { HousesFilter, HousesSort };

// The UI expects staff_assignments to be an array with a count object after mapping
export type HouseUIData = any; // Simplifying to avoid complex type duplication, as it's now handled in API

export function useHouses(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: HousesSort[] = [],
  filters: HousesFilter = {},
  branchId?: string
) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSES, { pageIndex, pageSize, sort, filters, branchId }],
    queryFn: () => housesApi.list({ pageIndex, pageSize, sort, filters, branchId }),
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

export function useAddHouse() {
  const queryClient = useQueryClient();
  const { mutateAsync: logActivity } = useLogActivity();

  return useMutation({
    mutationFn: async (house: Database['public']['Tables']['ic_houses']['Insert']) => {
      const data = await housesApi.create(house);
      
      await logActivity({
        activityType: 'create',
        entityType: 'house',
        entityId: data.id,
        entityName: data.house_name,
        customDescription: `New house added: ${data.house_name}`
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
    },
  });
}

export function useUpdateHouse() {
  const queryClient = useQueryClient();
  const { mutateAsync: logActivity } = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_houses']['Update'] }) => {
      const data = await housesApi.update(id, updates);

      await logActivity({
        activityType: 'update',
        entityType: 'house',
        entityId: data.id,
        entityName: data.house_name,
        customDescription: `House updated: ${data.house_name}`
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES, data.id] });
    },
  });
}

export function useDeleteHouse() {
  const queryClient = useQueryClient();
  const { mutateAsync: logActivity } = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, house_name }: { id: string; house_name: string }) => {
      await housesApi.delete(id);

      await logActivity({
        activityType: 'delete',
        entityType: 'house',
        entityId: id,
        entityName: house_name,
        customDescription: `House deleted: ${house_name}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSES] });
    },
  });
}
