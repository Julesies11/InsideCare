export type ActivityType = 'create' | 'update' | 'delete';
export type EntityType = 'participant' | 'staff' | 'incident' | 'compliance' | 'shift_note' | 'branch' | 'medication' | 'document' | 'service_provider';

export interface ActivityLog {
  id: string;
  activity_type: ActivityType;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string | null;
  description: string;
  user_name: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}
