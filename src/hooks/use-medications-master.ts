import {
  masterListsApi,
  MedicationsFilter,
  MedicationsSort,
} from '@/api/master-lists.api';
import { useAuth } from '@/auth/context/auth-context';
import { MedicationMaster } from '@/models/medication-master';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { detectChanges, logActivity } from '@/lib/activity-logger';

export function useMedicationsMaster(
  pageIndex: number = 0,
  pageSize: number = 50,
  sort: MedicationsSort[] = [],
  filters: MedicationsFilter = {},
) {
  const query = useQuery({
    queryKey: [
      QUERY_KEYS.MEDICATIONS_MASTER,
      { pageIndex, pageSize, sort, filters },
    ],
    queryFn: () =>
      masterListsApi.medications.list(pageIndex, pageSize, sort, filters),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    ...query,
    medications: query.data?.data || [],
    count: query.data?.count || 0,
    isLoading: query.isLoading,
    refresh: query.refetch,
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

export function useMedicationTypes(includeInactive = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, 'types', { includeInactive }],
    queryFn: () =>
      masterListsApi.medications.getMedicationTypes(includeInactive),
    staleTime: 1000 * 60 * 60,
  });
}

export function useAddMedicationType() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      const data = await masterListsApi.medications.createMedicationType(name);

      await logActivity({
        activityType: 'create',
        entityType: 'medication_type_master',
        entityId: data.id,
        entityName: data.medication_type_name,
        userName: user?.email || undefined,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, 'types'],
      });
    },
  });
}

export function useUpdateMedicationType() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      is_active,
      oldName,
      oldActive,
    }: {
      id: string;
      name?: string;
      is_active?: boolean;
      oldName?: string;
      oldActive?: boolean;
    }) => {
      const data = await masterListsApi.medications.updateMedicationType(id, {
        name,
        is_active,
      });

      const changes: any = {};
      if (name && oldName && name !== oldName) {
        changes.medication_type_name = { old: oldName, new: name };
      }
      if (
        is_active !== undefined &&
        oldActive !== undefined &&
        is_active !== oldActive
      ) {
        changes.is_active = { old: oldActive, new: is_active };
      }

      await logActivity({
        activityType: 'update',
        entityType: 'medication_type_master',
        entityId: data.id,
        entityName: data.medication_type_name,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
        userName: user?.email || undefined,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, 'types'],
      });
    },
  });
}

export function useDeleteMedicationType() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await masterListsApi.medications.deleteMedicationType(id);

      await logActivity({
        activityType: 'delete',
        entityType: 'medication_type_master',
        entityId: id,
        entityName: name,
        userName: user?.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDICATIONS_MASTER, 'types'],
      });
    },
  });
}

export function useAddMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      medication: Omit<
        MedicationMaster,
        'id' | 'created_at' | 'updated_at' | 'medication_type'
      >,
    ) => {
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDICATIONS_MASTER],
      });
    },
  });
}

export function useUpdateMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      oldMedication,
    }: {
      id: string;
      updates: Partial<MedicationMaster>;
      oldMedication?: MedicationMaster;
    }) => {
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDICATIONS_MASTER],
      });
    },
  });
}

export function useDeleteMedicationMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      medication_name,
    }: {
      id: string;
      medication_name: string;
    }) => {
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDICATIONS_MASTER],
      });
    },
  });
}
