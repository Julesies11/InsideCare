import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ActivityLog } from '@/models/activity-log';

interface UseActivityLogOptions {
  entityId?: string;
  entityType?: string;
  limit?: number;
}

export function useActivityLog({ entityId, entityType, limit = 50 }: UseActivityLogOptions = {}) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [entityId, entityType, limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('activity_log')
        .select('*')
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

      setActivities(data || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity log';
      console.error('Error fetching activity log:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { activities, loading, error, refetch: fetchActivities };
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

export async function logActivity({
  activityType,
  entityType,
  entityId,
  entityName,
  userName,
  customDescription,
  metadata
}: LogActivityParams) {
  try {
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
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to log activity';
    console.error('Error logging activity:', err);
    return { data: null, error: errorMessage };
  }
}
