import { masterListsApi } from '@/api/master-lists.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/config/query-keys';

export interface IncidentTypeMaster {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useIncidentTypesMaster(includeInactive = false) {
  return useQuery({
    queryKey: [QUERY_KEYS.INCIDENT_TYPES_MASTER, includeInactive],
    queryFn: async () => {
      return await masterListsApi.incidentTypes.list(includeInactive);
    },
  });
}

export function useAddIncidentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<IncidentTypeMaster>) => {
      return await masterListsApi.incidentTypes.upsert(newItem as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.INCIDENT_TYPES_MASTER],
      });
      toast.success('Incident type added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding incident type:', error);
      toast.error(error.message || 'Failed to add incident type');
    },
  });
}

export function useUpdateIncidentTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updatedItem: Partial<IncidentTypeMaster> & { id: string },
    ) => {
      return await masterListsApi.incidentTypes.upsert(updatedItem as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.INCIDENT_TYPES_MASTER],
      });
      toast.success('Incident type updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating incident type:', error);
      toast.error(error.message || 'Failed to update incident type');
    },
  });
}
