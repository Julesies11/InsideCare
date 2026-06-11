import { masterListsApi } from '@/api/master-lists.api';
import { useAuth } from '@/auth/context/auth-context';
import { ContactTypeMaster } from '@/models/contact-type-master';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { detectChanges, logActivity } from '@/lib/activity-logger';

export function useContactTypesMaster(includeInactive = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER, { includeInactive }],
    queryFn: () => masterListsApi.contactTypes.list(includeInactive),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddContactTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      contactType: Omit<ContactTypeMaster, 'id' | 'created_at' | 'updated_at'>,
    ) => {
      const data = await masterListsApi.contactTypes.create(contactType);

      await logActivity({
        activityType: 'create',
        entityType: 'contact_type_master',
        entityId: data.id,
        entityName: data.contact_type_name,
        userName: user?.email || undefined,
      });

      return data;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      oldContactType,
    }: {
      id: string;
      updates: Partial<ContactTypeMaster>;
      oldContactType?: ContactTypeMaster;
    }) => {
      const data = await masterListsApi.contactTypes.update(id, updates);

      if (oldContactType) {
        const changes = detectChanges(oldContactType, data);
        if (Object.keys(changes).length > 0) {
          await logActivity({
            activityType: 'update',
            entityType: 'contact_type_master',
            entityId: data.id,
            entityName: data.contact_type_name,
            changes,
            userName: user?.email || undefined,
          });
        }
      }

      return data;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      contact_type_name,
    }: {
      id: string;
      contact_type_name: string;
    }) => {
      await masterListsApi.contactTypes.delete(id);

      await logActivity({
        activityType: 'delete',
        entityType: 'contact_type_master',
        entityId: id,
        entityName: contact_type_name,
        userName: user?.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER],
      });
    },
  });
}
