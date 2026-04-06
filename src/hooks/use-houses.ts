import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { House } from '@/models/house';
import { useLogActivity } from '@/hooks/use-activity-log';

export interface HousesFilter {
  search?: string;
  statuses?: string[];
}

export interface HousesSort {
  id: string;
  desc: boolean;
}

const HOUSE_COLUMNS = 'id, name, branch_id, address, phone, capacity, current_occupancy, house_manager, status, notes, created_at, updated_at';

export function useHouses(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: HousesSort[] = [],
  filters: HousesFilter = {},
  branchId?: string
) {
  const query = useQuery({
    queryKey: ['houses', { pageIndex, pageSize, sort, filters, branchId }],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // We fetch the houses with their checklists count and staff assignments.
      // To get an accurate 'active' count without complex DB views, we fetch the basic assignment info 
      // and filter for active staff and non-expired assignments.
      let query = supabase
        .from('houses')
        .select(`
          ${HOUSE_COLUMNS}, 
          checklists:house_checklists(count), 
          staff_assignments:house_staff_assignments(
            id, 
            end_date,
            staff:staff_id(status)
          )
        `, { count: 'exact' });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,house_manager.ilike.%${filters.search}%`);
      }

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          query = query.order(s.id, { ascending: !s.desc });
        });
      } else {
        query = query.order('name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      // Calculate active staff count on the client side for each house
      const formattedData = (data || []).map((house: any) => {
        const activeStaffCount = (house.staff_assignments || []).filter((assignment: any) => {
          const isStaffActive = assignment.staff?.status === 'active';
          const isAssignmentActive = !assignment.end_date || assignment.end_date >= today;
          return isStaffActive && isAssignmentActive;
        }).length;

        return {
          ...house,
          // Replace the original staff_assignments with the calculated count
          // This keeps the UI component (which expects { count: X } or just X) simple
          staff_assignments: [{ count: activeStaffCount }]
        };
      });

      return { data: formattedData as House[], count: count || 0 };
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
    mutationFn: async (house: Omit<House, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('houses')
        .insert([house])
        .select(HOUSE_COLUMNS)
        .single();

      if (error) throw error;
      
      await logActivity({
        activityType: 'create',
        entityType: 'house',
        entityId: data.id,
        entityName: data.name,
        customDescription: `New house added: ${data.name}`
      });

      return data as House;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
    },
  });
}

export function useUpdateHouse() {
  const queryClient = useQueryClient();
  const { mutateAsync: logActivity } = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<House> }) => {
      const { data, error } = await supabase
        .from('houses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(HOUSE_COLUMNS)
        .single();

      if (error) throw error;

      await logActivity({
        activityType: 'update',
        entityType: 'house',
        entityId: data.id,
        entityName: data.name,
        customDescription: `House updated: ${data.name}`
      });

      return data as House;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['houses', data.id] });
    },
  });
}

export function useDeleteHouse() {
  const queryClient = useQueryClient();
  const { mutateAsync: logActivity } = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logActivity({
        activityType: 'delete',
        entityType: 'house',
        entityId: id,
        entityName: name,
        customDescription: `House deleted: ${name}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
    },
  });
}
