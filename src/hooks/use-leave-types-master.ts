import { masterListsApi } from '@/api/master-lists.api';
import { LeaveTypeMaster } from '@/models/leave-type-master';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

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

  return useMutation({
    mutationFn: async (
      leaveType: Omit<LeaveTypeMaster, 'id' | 'created_at'>,
    ) => {
      const data = await masterListsApi.leaveTypes.upsert(leaveType as any);
      return data as LeaveTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
    },
  });
}

export function useUpdateLeaveTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<LeaveTypeMaster>;
      oldLeaveType?: LeaveTypeMaster;
    }) => {
      const data = await masterListsApi.leaveTypes.upsert({
        ...updates,
        id,
      } as any);

      return data as LeaveTypeMaster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
    },
  });
}

export function useDeleteLeaveTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      leave_type_name?: string;
    }) => {
      await masterListsApi.leaveTypes.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
    },
  });
}
