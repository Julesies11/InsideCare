import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterListsApi } from '@/api/master-lists.api';
import { QUERY_KEYS } from '@/config/query-keys';
import { toast } from 'sonner';

export interface SeizureTypeMaster {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useSeizureTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.SEIZURE_TYPES_MASTER],
    queryFn: async () => {
      return await masterListsApi.seizureTypes.list();
    },
  });
}

export function useAddSeizureTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<SeizureTypeMaster>) => {
      return await masterListsApi.seizureTypes.upsert(newItem as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEIZURE_TYPES_MASTER] });
      toast.success('Seizure type added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding seizure type:', error);
      toast.error(error.message || 'Failed to add seizure type');
    },
  });
}

export function useUpdateSeizureTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedItem: Partial<SeizureTypeMaster> & { id: string }) => {
      return await masterListsApi.seizureTypes.upsert(updatedItem as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEIZURE_TYPES_MASTER] });
      toast.success('Seizure type updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating seizure type:', error);
      toast.error(error.message || 'Failed to update seizure type');
    },
  });
}
