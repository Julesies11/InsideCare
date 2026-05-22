import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ContactTypeMaster } from '@/models/contact-type-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

const CONTACT_TYPE_MASTER_COLUMNS = 'id, contact_type_name, is_active, created_by, updated_by, created_at, updated_at';

export function useContactTypesMaster(includeInactive = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER, { includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .select(CONTACT_TYPE_MASTER_COLUMNS)
        .order('contact_type_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContactTypeMaster[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddContactTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contactType: Omit<ContactTypeMaster, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .insert(contactType)
        .select(CONTACT_TYPE_MASTER_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to add this contact type.');
      }

      await logActivity({
        activityType: 'create',
        entityType: 'contact_type_master',
        entityId: data.id,
        entityName: data.contact_type_name,
        userName: user?.email || undefined,
      });

      return data as ContactTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER] });
    },
  });
}

export function useUpdateContactTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates, oldContactType }: { id: string; updates: Partial<ContactTypeMaster>; oldContactType?: ContactTypeMaster }) => {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .update(updates)
        .eq('id', id)
        .select(CONTACT_TYPE_MASTER_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this contact type, or it does not exist.');
      }

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

      return data as ContactTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER] });
    },
  });
}

export function useDeleteContactTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, contact_type_name }: { id: string; contact_type_name: string }) => {
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .update({
          is_active: false,
        })
        .eq('id', id);

      if (error) throw error;

      await logActivity({
        activityType: 'delete',
        entityType: 'contact_type_master',
        entityId: id,
        entityName: contact_type_name,
        userName: user?.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONTACT_TYPES_MASTER] });
    },
  });
}
