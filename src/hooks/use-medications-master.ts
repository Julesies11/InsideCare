import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MedicationMaster } from '@/models/medication-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

const MEDICATION_MASTER_COLUMNS = 'id, medication_name, category, common_dosages, side_effects, interactions, is_active, created_by, updated_by, created_at, updated_at';

export function useMedicationsMaster(includeInactive = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, { includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select(MEDICATION_MASTER_COLUMNS)
        .order('medication_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MedicationMaster[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
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
