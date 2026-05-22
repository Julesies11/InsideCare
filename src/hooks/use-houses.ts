import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLogActivity } from '@/hooks/use-activity-log';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export interface HousesFilter {
  search?: string;
  statuses?: string[];
}

export interface HousesSort {
  id: string;
  desc: boolean;
}

const HOUSE_COLUMNS = 'id, house_name, branch_id, address, phone, capacity, current_occupancy, house_manager, status, notes, created_by, updated_by, created_at, updated_at';

// Define the query so we can extract its return type
const getHousesQuery = () => supabase
  .from(TABLES.HOUSES)
  .select(`
    ${HOUSE_COLUMNS}, 
    checklists:ic_house_checklists(count), 
    staff_assignments:ic_house_staff_assignments(
      id, 
      end_date,
      staff:staff_id(status)
    )
  `);

export type HouseWithRelations = Awaited<ReturnType<typeof getHousesQuery>>['data'] extends (infer U)[] ? U : never;
// The UI expects staff_assignments to be an array with a count object after mapping
export type HouseUIData = Omit<HouseWithRelations, 'staff_assignments'> & { staff_assignments?: Array<{ count: number }> };

export function useHouses(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: HousesSort[] = [],
  filters: HousesFilter = {},
  branchId?: string
) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSES, { pageIndex, pageSize, sort, filters, branchId }],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from(TABLES.HOUSES)
        .select(`
          ${HOUSE_COLUMNS}, 
          checklists:ic_house_checklists(count), 
          staff_assignments:ic_house_staff_assignments(
            id, 
            end_date,
            staff:staff_id(status)
          )
        `, { count: 'exact' });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      if (filters.search) {
        query = query.or(`house_name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,house_manager.ilike.%${filters.search}%`);
      }

      if (filters.statuses && filters.statuses.length > 0) {
        // Must assert status to the expected Enum type or use any for 'in' filter if not strict
        query = query.in('status', filters.statuses as any);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          const column = s.id === 'name' || s.id === 'house_name' ? 'house_name' : s.id;
          query = query.order(column as any, { ascending: !s.desc });
        });
      } else {
        query = query.order('house_name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      // Calculate active staff count on the client side for each house
      const formattedData = (data || []).map((house) => {
        const activeStaffCount = (house.staff_assignments || []).filter((assignment: any) => {
          // staff could be an array or single object depending on relation
          const staffObj = Array.isArray(assignment.staff) ? assignment.staff[0] : assignment.staff;
          const isStaffActive = staffObj?.status === 'active';
          const isAssignmentActive = !assignment.end_date || assignment.end_date >= today;
          return isStaffActive && isAssignmentActive;
        }).length;

        return {
          ...house,
          staff_assignments: [{ count: activeStaffCount }]
        };
      });

      return { data: formattedData as HouseUIData[], count: count || 0 };
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    ...query,
    houses: query.data?.data || [],
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
      const { data, error } = await supabase
        .from(TABLES.HOUSES)
        .insert([house])
        .select(HOUSE_COLUMNS)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      
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
      const { data, error } = await supabase
        .from(TABLES.HOUSES)
        .update(updates)
        .eq('id', id)
        .select(HOUSE_COLUMNS)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error('You do not have permission to edit this house, or it does not exist.');
      }

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
      const { error } = await supabase
        .from(TABLES.HOUSES)
        .delete()
        .eq('id', id);

      if (error) throw error;

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
