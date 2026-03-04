import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ActivityLog } from '@/models/activity-log';

interface UseActivityLogOptions {
  entityId?: string;
  entityType?: string;
  limit?: number;
}

const ACTIVITY_LOG_COLUMNS = 'id, activity_type, entity_type, entity_id, entity_name, description, user_name, metadata, created_at';

export function useActivityLog({ entityId, entityType, limit = 50 }: UseActivityLogOptions = {}) {
  const query = useQuery({
    queryKey: ['activity-log', { entityId, entityType, limit }],
    queryFn: async () => {
      let query = supabase
        .from('activity_log')
        .select(ACTIVITY_LOG_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityLog[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    activities: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
  };
}

interface LogActivityParams {
  activityType: 'create' | 'update' | 'delete';
  entityType: ActivityLog['entity_type'];
  entityId: string;
  entityName?: string;
  userName?: string;
  customDescription?: string;
  metadata?: any;
}

export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
      entityType,
      entityId,
      entityName,
      userName,
      customDescription,
      metadata
    }: LogActivityParams) => {
      const descriptions = {
        create: `New ${entityType} created: ${entityName || entityId}`,
        update: `${entityType} updated: ${entityName || entityId}`,
        delete: `${entityType} deleted: ${entityName || entityId}`
      };

      const { data, error } = await supabase
        .from('activity_log')
        .insert([{
          activity_type: activityType,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          description: customDescription || descriptions[activityType],
          user_name: userName,
          metadata: metadata
        }])
        .select(ACTIVITY_LOG_COLUMNS)
        .single();

      if (error) throw error;
      return data as ActivityLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}

export function useActivityLogHelpers() {
  const { mutateAsync: logActivity } = useLogActivity();

  const logParticipantActivity = (
    type: 'create' | 'update' | 'delete',
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
    type: 'create' | 'update' | 'delete',
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
    type: 'create' | 'update' | 'delete',
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
    type: 'create' | 'update' | 'delete',
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
    type: 'create' | 'update' | 'delete',
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
    type: 'create' | 'update' | 'delete',
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
  const descriptions = {
    create: `New ${params.entityType} created: ${params.entityName || params.entityId}`,
    update: `${params.entityType} updated: ${params.entityName || params.entityId}`,
    delete: `${params.entityType} deleted: ${params.entityName || params.entityId}`
  };

  const { data, error } = await supabase
    .from('activity_log')
    .insert([{
      activity_type: params.activityType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      description: params.customDescription || descriptions[params.activityType],
      user_name: params.userName,
      metadata: params.metadata
    }])
    .select(ACTIVITY_LOG_COLUMNS)
    .single();

  if (error) throw error;
  return { data, error: null };
}
