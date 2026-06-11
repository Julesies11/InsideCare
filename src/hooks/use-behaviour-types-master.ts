import { masterListsApi } from '@/api/master-lists.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/config/query-keys';

export interface BehaviourTypeMaster {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useBehaviourTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.BEHAVIOUR_TYPES_MASTER],
    queryFn: async () => {
      return await masterListsApi.behaviourTypes.list();
    },
  });
}

export function useAddBehaviourTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<BehaviourTypeMaster>) => {
      return await masterListsApi.behaviourTypes.upsert(newItem as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BEHAVIOUR_TYPES_MASTER],
      });
      toast.success('Behaviour type added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding behaviour type:', error);
      toast.error(error.message || 'Failed to add behaviour type');
    },
  });
}

export function useUpdateBehaviourTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updatedItem: Partial<BehaviourTypeMaster> & { id: string },
    ) => {
      return await masterListsApi.behaviourTypes.upsert(updatedItem as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BEHAVIOUR_TYPES_MASTER],
      });
      toast.success('Behaviour type updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating behaviour type:', error);
      toast.error(error.message || 'Failed to update behaviour type');
    },
  });
}
