import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ContactTypeMaster } from '@/models/contact-type-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';

const CONTACT_TYPE_MASTER_COLUMNS = 'id, name, is_active, created_by, updated_by, created_at, updated_at';

export function useContactTypesMaster(includeInactive = true) {
  return useQuery({
    queryKey: ['contact-types-master', { includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from('contact_types_master')
        .select(CONTACT_TYPE_MASTER_COLUMNS)
        .order('name', { ascending: true });

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
        .from('contact_types_master')
        .insert({
          ...contactType,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        })
        .select(CONTACT_TYPE_MASTER_COLUMNS)
        .single();

      if (error) throw error;

      await logActivity({
        activityType: 'create',
        entityType: 'contact_type_master',
        entityId: data.id,
        entityName: data.name,
        userName: user?.email || undefined,
      });

      return data as ContactTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-types-master'] });
    },
  });
}

export function useUpdateContactTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates, oldContactType }: { id: string; updates: Partial<ContactTypeMaster>; oldContactType?: ContactTypeMaster }) => {
      const { data, error } = await supabase
        .from('contact_types_master')
        .update({
          ...updates,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(CONTACT_TYPE_MASTER_COLUMNS)
        .single();

      if (error) throw error;

      if (oldContactType) {
        const changes = detectChanges(oldContactType, data);
        if (Object.keys(changes).length > 0) {
          await logActivity({
            activityType: 'update',
            entityType: 'contact_type_master',
            entityId: data.id,
            entityName: data.name,
            changes,
            userName: user?.email || undefined,
          });
        }
      }

      return data as ContactTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-types-master'] });
    },
  });
}

export function useDeleteContactTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from('contact_types_master')
        .update({
          is_active: false,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await logActivity({
        activityType: 'delete',
        entityType: 'contact_type_master',
        entityId: id,
        entityName: name,
        userName: user?.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-types-master'] });
    },
  });
}
