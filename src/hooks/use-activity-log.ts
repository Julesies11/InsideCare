import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActivityType } from '@/models/activity-log';
import { QUERY_KEYS } from '@/config/query-keys';
import { activityLogApi, ActivityLogListOptions, LogActivityParams } from '@/api/activity-log.api';

export function useActivityLog(options: ActivityLogListOptions = {}) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ACTIVITY_LOG, options],
    queryFn: () => activityLogApi.list(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    activities: query.data?.data || [],
    count: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}

export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: LogActivityParams) => activityLogApi.log(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVITY_LOG] });
    },
  });
}

export function useActivityLogHelpers() {
  const { mutateAsync: logActivity } = useLogActivity();

  const logParticipantActivity = (
    type: ActivityType,
    participantId: string,
    participantName: string,
    userName?: string
  ) => logActivity({
    activityType: type,
    entityType: 'participant',
    entityId: participantId,
    entityName: participantName,
    userName
  });

  const logStaffActivity = (
    type: ActivityType,
    staffId: string,
    staffName: string,
    userName?: string
  ) => logActivity({
    activityType: type,
    entityType: 'staff',
    entityId: staffId,
    entityName: staffName,
    userName
  });

  const logIncidentActivity = (
    type: ActivityType,
    incidentId: string,
    incidentType: string,
    userName?: string
  ) => logActivity({
    activityType: type,
    entityType: 'incident',
    entityId: incidentId,
    entityName: incidentType,
    userName
  });

  const logComplianceActivity = (
    type: ActivityType,
    complianceId: string,
    complianceName: string,
    staffName: string,
    userName?: string
  ) => logActivity({
    activityType: type,
    entityType: 'compliance',
    entityId: complianceId,
    entityName: complianceName,
    userName,
    metadata: { staff_name: staffName }
  });

  const logShiftNoteActivity = (
    type: ActivityType,
    noteId: string,
    summary: string,
    userName?: string
  ) => logActivity({
    activityType: type,
    entityType: 'shift_note',
    entityId: noteId,
    entityName: summary,
    userName
  });

  const logBranchActivity = (
    type: ActivityType,
    branchId: string,
    branchName: string,
    userName?: string
  ) => logActivity({
    activityType: type,
    entityType: 'branch',
    entityId: branchId,
    entityName: branchName,
    userName
  });

  return {
    logParticipantActivity,
    logStaffActivity,
    logIncidentActivity,
    logComplianceActivity,
    logShiftNoteActivity,
    logBranchActivity,
  };
}

// Keeping a non-hook version for places where hooks can't be used
export async function logActivity(params: LogActivityParams) {
  try {
    const data = await activityLogApi.log(params);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
