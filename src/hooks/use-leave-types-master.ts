import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { LeaveTypeMaster } from '@/models/leave-type-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

const LEAVE_TYPE_COLUMNS = 'id, leave_type_name, is_active, created_by, updated_by, created_at';

export function useLeaveTypesMaster(includeInactive = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_TYPES, { includeInactive }],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.LEAVE_TYPES)
        .select(LEAVE_TYPE_COLUMNS)
        .order('leave_type_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LeaveTypeMaster[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useAddLeaveTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leaveType: Omit<LeaveTypeMaster, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.LEAVE_TYPES)
        .insert(leaveType)
        .select(LEAVE_TYPE_COLUMNS)
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      await logActivity({
        activityType: 'create',
        entityType: 'leave_type_master',
        entityId: data.id,
        entityName: data.leave_type_name,
        userName: user?.email || undefined,
      });

      return data as LeaveTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
    },
  });
}

export function useUpdateLeaveTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates, oldLeaveType }: { id: string; updates: Partial<LeaveTypeMaster>; oldLeaveType?: LeaveTypeMaster }) => {
      const { data, error } = await supabase
        .from(TABLES.LEAVE_TYPES)
        .update(updates)
        .eq('id', id)
        .select(LEAVE_TYPE_COLUMNS)
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      if (oldLeaveType) {
        const changes = detectChanges(oldLeaveType, data);
        if (Object.keys(changes).length > 0) {
          await logActivity({
            activityType: 'update',
            entityType: 'leave_type_master',
            entityId: data.id,
            entityName: data.leave_type_name,
            changes,
            userName: user?.email || undefined,
          });
        }
      }

      return data as LeaveTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
    },
  });
}

export function useDeleteLeaveTypeMaster() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, leave_type_name }: { id: string; leave_type_name: string }) => {
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from(TABLES.LEAVE_TYPES)
        .update({
          is_active: false,
        })
        .eq('id', id);

      if (error) throw error;

      await logActivity({
        activityType: 'delete',
        entityType: 'leave_type_master',
        entityId: id,
        entityName: leave_type_name,
        userName: user?.email || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
    },
  });
}
