import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MedicationMaster } from '@/models/medication-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

const MEDICATION_MASTER_COLUMNS = 'id, medication_name, category, common_dosages, side_effects, interactions, is_active, created_by, updated_by, created_at, updated_at';

export interface MedicationsFilter {
  search?: string;
  category?: string;
  includeInactive?: boolean;
}

export interface MedicationsSort {
  id: string;
  desc: boolean;
}

export function useMedicationsMaster(
  pageIndex: number = 0,
  pageSize: number = 50,
  sort: MedicationsSort[] = [],
  filters: MedicationsFilter = {}
) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, { pageIndex, pageSize, sort, filters }],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select(MEDICATION_MASTER_COLUMNS, { count: 'exact' });

      if (filters.search) {
        query = query.ilike('medication_name', `%${filters.search}%`);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.includeInactive === false) {
        query = query.eq('is_active', true);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          query = query.order(s.id as any, { ascending: !s.desc });
        });
      } else {
        query = query.order('medication_name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as MedicationMaster[], count: count || 0 };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    ...query,
    medications: query.data?.data || [],
    count: query.data?.count || 0,
    loading: query.isLoading,
  };
}

export function useMedicationMaster(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select(MEDICATION_MASTER_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as MedicationMaster;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
  });
}

export function useMedicationCategories() {
  return useQuery({
    queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select('category')
        .not('category', 'is', null)
        .order('category');

      if (error) throw error;
      
      const categories = Array.from(new Set(data.map(m => m.category)))
        .filter((c): c is string => !!c)
        .sort();
        
      return categories;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useAddMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (medication: Omit<MedicationMaster, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .insert(medication)
        .select(MEDICATION_MASTER_COLUMNS)
        .maybeSingle();

      if (error) {
        if (error.code === '23505' && error.message.includes('medications_master_medication_name_key')) {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      await logActivity({
        activityType: 'create',
        entityType: 'medication_master',
        entityId: data.id,
        entityName: data.medication_name,
        userName: user?.email || undefined,
      });

      return data as MedicationMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MEDICATIONS_MASTER] });
    },
  });
}

export function useUpdateMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates, oldMedication }: { id: string; updates: Partial<MedicationMaster>; oldMedication?: MedicationMaster }) => {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .update(updates)
        .eq('id', id)
        .select(MEDICATION_MASTER_COLUMNS)
        .maybeSingle();

      if (error) {
        if (error.code === '23505' && error.message.includes('medications_master_medication_name_key')) {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      if (oldMedication) {
        const changes = detectChanges(oldMedication, data);
        if (Object.keys(changes).length > 0) {
          await logActivity({
            activityType: 'update',
            entityType: 'medication_master',
            entityId: data.id,
            entityName: data.medication_name,
            changes,
            userName: user?.email || undefined,
          });
        }
      }

      return data as MedicationMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MEDICATIONS_MASTER] });
    },
  });
}

export function useDeleteMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, medication_name }: { id: string; medication_name: string }) => {
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .update({
          is_active: false,
        })
        .eq('id', id);

      if (error) throw error;

      await logActivity({
        activityType: 'delete',
        entityType: 'medication_master',
        entityId: id,
        entityName: medication_name,
        userName: user?.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MEDICATIONS_MASTER] });
    },
  });
}
