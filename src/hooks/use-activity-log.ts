import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ActivityLog, ActivityType } from '@/models/activity-log';
import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

interface UseActivityLogOptions {
  entityId?: string;
  entityType?: string;
  limit?: number;
  pageIndex?: number;
  pageSize?: number;
  sort?: { id: string; desc: boolean }[];
  category?: 'all' | 'data_changes' | 'logins_security';
  search?: string;
  userName?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
}

const ACTIVITY_LOG_COLUMNS = 'id, activity_type, entity_type, entity_id, entity_name, description, user_name, user_id, table_name, parent_name, parent_type, metadata, created_at';
const ACTIVITY_LOG_LIST_COLUMNS = 'id, activity_type, entity_type, entity_id, entity_name, description, user_name, user_id, table_name, parent_name, parent_type, created_at';

export function useActivityLog({ 
  entityId, 
  entityType, 
  limit,
  pageIndex = 0,
  pageSize = 50,
  sort = [],
  category = 'all',
  search,
  userName,
  module,
  startDate,
  endDate
}: UseActivityLogOptions = {}) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.ACTIVITY_LOG, { entityId, entityType, limit, pageIndex, pageSize, sort, category, search, userName, module, startDate, endDate }],
    queryFn: async () => {
      // Use list columns for bulk table views unless we're looking at a single entity's log
      const columns = (limit && limit > 1 && !entityId) || (!limit && !entityId) ? ACTIVITY_LOG_LIST_COLUMNS : ACTIVITY_LOG_COLUMNS;
      
      let query = supabase
        .from(TABLES.ACTIVITY_LOG)
        .select(columns as any, { count: 'exact' });

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      // New filters
      if (userName) {
        query = query.eq('user_name', userName);
      }

      if (module) {
        if (module === 'employees') {
          query = query.or('entity_type.eq.staff,entity_type.ilike.staff_%');
        } else if (module === 'participants') {
          query = query.or('entity_type.eq.participants,entity_type.eq.participant,entity_type.ilike.participant_%');
        } else if (module === 'houses') {
          query = query.or('entity_type.eq.houses,entity_type.eq.house,entity_type.ilike.house_%');
        } else {
          query = query.eq('entity_type', module);
        }
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        // Adjust end date to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }

      // Category-based filtering
      if (category === 'data_changes') {
        // Data changes are typically create/update/delete on non-auth entities
        query = query.not('entity_type', 'eq', 'auth');
      } else if (category === 'logins_security') {
        // Logins and security events are strictly entity_type = 'auth'
        query = query.eq('entity_type', 'auth');
      }

      if (search) {
        query = query.or(`description.ilike.%${search}%,user_name.ilike.%${search}%,entity_name.ilike.%${search}%`);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          query = query.order(s.id as any, { ascending: !s.desc });
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (limit) {
        query = query.limit(limit);
      } else {
        const from = pageIndex * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        data: data as unknown as ActivityLog[],
        count: count || 0
      };
    },
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

interface LogActivityParams {
  activityType: ActivityType;
  entityType: string;
  entityId: string;
  entityName?: string;
  userName?: string;
  customDescription?: string;
  metadata?: Record<string, unknown>;
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
      const descriptions: Record<string, string> = {
        create: `New ${entityType} created: ${entityName || entityId}`,
        update: `${entityType} updated: ${entityName || entityId}`,
        delete: `${entityType} deleted: ${entityName || entityId}`
      };

      const { data, error } = await supabase
        .from(TABLES.ACTIVITY_LOG)
        .insert([{
          activity_type: activityType,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          description: customDescription || (descriptions[activityType as string] || `${entityType} ${activityType}`),
          user_name: userName,
          metadata: metadata as any
        }])
        .select(ACTIVITY_LOG_COLUMNS as any)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to log this activity.');
      }
      return data as unknown as ActivityLog;
    },
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
  const descriptions: Record<string, string> = {
    create: `New ${params.entityType} created: ${params.entityName || params.entityId}`,
    update: `${params.entityType} updated: ${params.entityName || params.entityId}`,
    delete: `${params.entityType} deleted: ${params.entityName || params.entityId}`
  };

  const { data, error } = await supabase
    .from(TABLES.ACTIVITY_LOG)
    .insert([{
      activity_type: params.activityType,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      description: params.customDescription || (descriptions[params.activityType as string] || `${params.entityType} ${params.activityType}`),
      user_name: params.userName,
      metadata: params.metadata as any
    }])
    .select(ACTIVITY_LOG_COLUMNS as any)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('You do not have permission to log this activity.');
  }
  return { data, error: null };
}
