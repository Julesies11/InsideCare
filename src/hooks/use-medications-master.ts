import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicationMaster } from '@/models/medication-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { QUERY_KEYS } from '@/config/query-keys';
import { masterListsApi, MedicationsFilter, MedicationsSort } from '@/api/master-lists.api';

export function useMedicationsMaster(
  pageIndex: number = 0,
  pageSize: number = 50,
  sort: MedicationsSort[] = [],
  filters: MedicationsFilter = {}
) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, { pageIndex, pageSize, sort, filters }],
    queryFn: () => masterListsApi.medications.list(pageIndex, pageSize, sort, filters),
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
    queryFn: () => {
      if (!id || id === 'new') return null;
      return masterListsApi.medications.getById(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
  });
}

export function useMedicationCategories() {
  return useQuery({
    queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, 'categories'],
    queryFn: () => masterListsApi.medications.getCategories(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useAddMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (medication: Omit<MedicationMaster, 'id' | 'created_at' | 'updated_at'>) => {
      const data = await masterListsApi.medications.create(medication);

      await logActivity({
        activityType: 'create',
        entityType: 'medication_master',
        entityId: data.id,
        entityName: data.medication_name,
        userName: user?.email || undefined,
      });

      return data;
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
      const data = await masterListsApi.medications.update(id, updates);

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

      return data;
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
      await masterListsApi.medications.delete(id);

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
