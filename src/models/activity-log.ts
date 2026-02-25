export type ActivityType = 'create' | 'update' | 'delete' | 'submit' | 'approve' | 'reject' | 'archive' | 'activate';
export type EntityType = 'participant' | 'staff' | 'incident' | 'compliance' | 'shift_note' | 'branch' | 'medication' | 'medication_master' | 'document' | 'contact' | 'contact_type_master' | 'participant_funding' | 'funding_source_master' | 'funding_type_master' | 'timesheet' | 'house';

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
