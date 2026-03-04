import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MedicationMaster } from '@/models/medication-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';

const MEDICATION_MASTER_COLUMNS = 'id, name, category, common_dosages, side_effects, interactions, is_active, created_by, updated_by, created_at, updated_at';

export function useMedicationsMaster(includeInactive = true) {
  return useQuery({
    queryKey: ['medications-master', { includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from('medications_master')
        .select(MEDICATION_MASTER_COLUMNS)
        .order('name', { ascending: true });

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
        .from('medications_master')
        .insert({
          ...medication,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        })
        .select(MEDICATION_MASTER_COLUMNS)
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('medications_master_name_key')) {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      await logActivity({
        activityType: 'create',
        entityType: 'medication_master',
        entityId: data.id,
        entityName: data.name,
        userName: user?.email || undefined,
      });

      return data as MedicationMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications-master'] });
    },
  });
}

export function useUpdateMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates, oldMedication }: { id: string; updates: Partial<MedicationMaster>; oldMedication?: MedicationMaster }) => {
      const { data, error } = await supabase
        .from('medications_master')
        .update({
          ...updates,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(MEDICATION_MASTER_COLUMNS)
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('medications_master_name_key')) {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      if (oldMedication) {
        const changes = detectChanges(oldMedication, data);
        if (Object.keys(changes).length > 0) {
          await logActivity({
            activityType: 'update',
            entityType: 'medication_master',
            entityId: data.id,
            entityName: data.name,
            changes,
            userName: user?.email || undefined,
          });
        }
      }

      return data as MedicationMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications-master'] });
    },
  });
}

export function useDeleteMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from('medications_master')
        .update({
          is_active: false,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await logActivity({
        activityType: 'delete',
        entityType: 'medication_master',
        entityId: id,
        entityName: name,
        userName: user?.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications-master'] });
    },
  });
}
