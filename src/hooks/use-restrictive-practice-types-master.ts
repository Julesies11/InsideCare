import { masterListsApi } from '@/api/master-lists.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/config/query-keys';

export interface RestrictivePracticeTypeMaster {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useRestrictivePracticeTypesMaster(includeInactive = false) {
  return useQuery({
    queryKey: [QUERY_KEYS.RESTRICTIVE_PRACTICE_TYPES_MASTER, includeInactive],
    queryFn: async () => {
      return await masterListsApi.restrictivePracticeTypes.list(
        includeInactive,
      );
    },
  });
}

export function useAddRestrictivePracticeTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<RestrictivePracticeTypeMaster>) => {
      return await masterListsApi.restrictivePracticeTypes.upsert(
        newItem as any,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RESTRICTIVE_PRACTICE_TYPES_MASTER],
      });
      toast.success('Restrictive practice type added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding restrictive practice type:', error);
      toast.error(error.message || 'Failed to add restrictive practice type');
    },
  });
}

export function useUpdateRestrictivePracticeTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updatedItem: Partial<RestrictivePracticeTypeMaster> & { id: string },
    ) => {
      return await masterListsApi.restrictivePracticeTypes.upsert(
        updatedItem as any,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RESTRICTIVE_PRACTICE_TYPES_MASTER],
      });
      toast.success('Restrictive practice type updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating restrictive practice type:', error);
      toast.error(
        error.message || 'Failed to update restrictive practice type',
      );
    },
  });
}
