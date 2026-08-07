import { masterListsApi } from '@/api/master-lists.api';
import { ContactTypeMaster } from '@/models/contact-type-master';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export function useContactTypesMaster(includeInactive = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER, { includeInactive }],
    queryFn: () => masterListsApi.contactTypes.list(includeInactive),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddContactTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      contactType: Omit<ContactTypeMaster, 'id' | 'created_at' | 'updated_at'>,
    ) => {
      return await masterListsApi.contactTypes.create(contactType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER],
      });
    },
  });
}

export function useUpdateContactTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ContactTypeMaster>;
      oldContactType?: ContactTypeMaster;
    }) => {
      return await masterListsApi.contactTypes.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER],
      });
    },
  });
}

export function useDeleteContactTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      contact_type_name?: string;
    }) => {
      await masterListsApi.contactTypes.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER],
      });
    },
  });
}
