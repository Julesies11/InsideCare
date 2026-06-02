import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaveTypeMaster } from '@/models/leave-type-master';
import { useAuth } from '@/auth/context/auth-context';
import { logActivity, detectChanges } from '@/lib/activity-logger';
import { QUERY_KEYS } from '@/config/query-keys';
import { masterListsApi } from '@/api/master-lists.api';

export function useLeaveTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_TYPES],
    queryFn: async () => {
      const data = await masterListsApi.leaveTypes.list();
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
      const data = await masterListsApi.leaveTypes.upsert(leaveType as any);

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
      const data = await masterListsApi.leaveTypes.upsert({ ...updates, id } as any);

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
      // Hard delete since we don't have is_active
      await masterListsApi.leaveTypes.delete(id);

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
