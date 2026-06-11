import { Database } from './database.types';

export type ActivityType = Database['public']['Enums']['ic_activity_type_enum'];
export type EntityType = string; // No specific enum for entity types in schema yet, keep flexible

export type ActivityLogRow =
  Database['public']['Tables']['ic_activity_log']['Row'];

export interface ActivityLog extends ActivityLogRow {
  staff?: {
    id: string;
    staff_name: string;
    photo_url: string | null;
  } | null;
}
