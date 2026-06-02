import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { ACTIVITY_VIEWS } from '@/config/query-views';
import { ActivityLog, ActivityType } from '@/models/activity-log';

export interface ActivityLogListOptions {
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

export interface LogActivityParams {
  activityType: ActivityType;
  entityType: string;
  entityId: string;
  entityName?: string;
  userName?: string;
  customDescription?: string;
  metadata?: Record<string, unknown>;
}

export const activityLogApi = {
  /**
   * List activity logs with filtering and pagination.
   */
  async list({
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
    endDate,
  }: ActivityLogListOptions = {}) {
    // Use list columns for bulk table views unless we're looking at a single entity's log
    const columns = (limit && limit > 1 && !entityId) || (!limit && !entityId) 
      ? ACTIVITY_VIEWS.LIST 
      : ACTIVITY_VIEWS.DETAIL;

    let query = supabase
      .from(TABLES.ACTIVITY_LOG)
      .select(columns as any, { count: 'exact' });

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

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
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    if (category === 'data_changes') {
      query = query.not('entity_type', 'eq', 'auth');
    } else if (category === 'logins_security') {
      query = query.eq('entity_type', 'auth');
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,user_name.ilike.%${search}%,entity_name.ilike.%${search}%`);
    }

    if (sort.length > 0) {
      sort.forEach((s) => {
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
      count: count || 0,
    };
  },

  /**
   * Log a new activity.
   */
  async log({
    activityType,
    entityType,
    entityId,
    entityName,
    userName,
    customDescription,
    metadata,
  }: LogActivityParams) {
    const descriptions: Record<string, string> = {
      create: `New ${entityType} created: ${entityName || entityId}`,
      update: `${entityType} updated: ${entityName || entityId}`,
      delete: `${entityType} deleted: ${entityName || entityId}`,
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
        metadata: metadata as any,
      }])
      .select(ACTIVITY_VIEWS.DETAIL as any)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error('You do not have permission to log this activity.');
    }
    return data as unknown as ActivityLog;
  }
};
