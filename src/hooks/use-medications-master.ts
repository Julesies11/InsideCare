import {
  masterListsApi,
  MedicationsFilter,
  MedicationsSort,
} from '@/api/master-lists.api';
import { MedicationMaster } from '@/models/medication-master';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

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

  return useMutation({
    mutationFn: async (name: string) => {
      return await masterListsApi.medications.createMedicationType(name);
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

  return useMutation({
    mutationFn: async ({
      id,
      name,
      is_active,
    }: {
      id: string;
      name?: string;
      is_active?: boolean;
      oldName?: string;
      oldActive?: boolean;
    }) => {
      return await masterListsApi.medications.updateMedicationType(id, {
        name,
        is_active,
      });
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

  return useMutation({
    mutationFn: async ({ id }: { id: string; name?: string }) => {
      await masterListsApi.medications.deleteMedicationType(id);
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

  return useMutation({
    mutationFn: async (
      medication: Omit<
        MedicationMaster,
        'id' | 'created_at' | 'updated_at' | 'medication_type'
      >,
    ) => {
      return await masterListsApi.medications.create(medication);
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

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<MedicationMaster>;
      oldMedication?: MedicationMaster;
    }) => {
      return await masterListsApi.medications.update(id, updates);
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

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      medication_name?: string;
    }) => {
      await masterListsApi.medications.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MEDICATIONS_MASTER],
      });
    },
  });
}
