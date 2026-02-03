import { supabase } from './supabase';
import { ActivityType, EntityType } from '@/models/activity-log';

interface LogActivityParams {
  activityType: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  changes?: Record<string, { old: any; new: any }>;
  userName?: string;
  customDescription?: string;
}

// Field labels for better descriptions
const fieldLabels: Record<string, string> = {
  name: 'name',
  email: 'email address',
  phone: 'phone number',
  address: 'address',
  date_of_birth: 'date of birth',
  ndis_number: 'NDIS number',
  house_id: 'house assignment',
  photo_url: 'profile photo',
  is_active: 'status',
  support_level: 'support level',
  support_coordinator: 'support coordinator',
  primary_diagnosis: 'primary diagnosis',
  secondary_diagnosis: 'secondary diagnosis',
  allergies: 'allergies',
  morning_routine: 'morning routine',
  shower_support: 'shower support',
  current_goals: 'goals',
  general_notes: 'notes',
  restrictive_practices: 'restrictive practices',
  department: 'department',
  hire_date: 'hire date',
  qualifications: 'qualifications',
  certifications: 'certifications',
  employment_type: 'employment type',
  working_hours: 'working hours',
};

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '(empty)';
  }
  if (typeof value === 'boolean') {
    return value ? 'Active' : 'Inactive';
  }
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 47) + '...';
  }
  return String(value);
}

function generateDescription(
  activityType: ActivityType,
  entityType: EntityType,
  changes?: Record<string, { old: any; new: any }>,
  customDescription?: string
): string {
  if (customDescription) {
    return customDescription;
  }

  if (activityType === 'create') {
    return `Created new ${entityType.replace('_', ' ')}`;
  }

  if (activityType === 'delete') {
    return `Deleted ${entityType.replace('_', ' ')}`;
  }

  // For updates, generate description based on what changed
  if (activityType === 'update' && changes) {
    const changedFields = Object.keys(changes)
      .filter(key => key !== 'updated_at' && key !== 'photo_file' && key !== 'created_at') // Exclude system fields
      .filter(key => changes[key].old !== changes[key].new); // Only actual changes

    if (changedFields.length === 0) {
      return `Updated ${entityType.replace('_', ' ')}`;
    }

    if (changedFields.length === 1) {
      const field = changedFields[0];
      const label = fieldLabels[field] || field;
      const oldVal = formatValue(changes[field].old);
      const newVal = formatValue(changes[field].new);
      
      // Special case for photo
      if (field === 'photo_url') {
        return 'Updated profile photo';
      }
      
      return `Updated ${label} from "${oldVal}" to "${newVal}"`;
    }

    if (changedFields.length === 2) {
      const labels = changedFields.map(key => fieldLabels[key] || key);
      return `Updated ${labels[0]} and ${labels[1]}`;
    }

    // For 3+ fields, show first two and count
    const labels = changedFields.map(key => fieldLabels[key] || key);
    const remaining = changedFields.length - 2;
    return `Updated ${labels[0]}, ${labels[1]} and ${remaining} other field${remaining > 1 ? 's' : ''}`;
  }

  return `Updated ${entityType.replace('_', ' ')}`;
}

export async function logActivity({
  activityType,
  entityType,
  entityId,
  entityName,
  changes,
  userName,
  customDescription,
}: LogActivityParams): Promise<void> {
  try {
    const description = generateDescription(activityType, entityType, changes, customDescription);

    await supabase.from('activity_log').insert({
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName || null,
      description,
      user_name: userName || null,
      metadata: changes ? { changes } : null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break the main flow
  }
}

// Helper to normalize values for comparison (treat null, undefined, and empty string as equivalent)
function normalizeValue(value: any): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return value;
}

// Helper to detect changes between old and new objects
export function detectChanges(oldData: any, newData: any): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  for (const key in newData) {
    // Skip system fields and temporary fields
    if (key === 'updated_at' || key === 'created_at' || key === 'photo_file') {
      continue;
    }

    const oldValue = normalizeValue(oldData[key]);
    const newValue = normalizeValue(newData[key]);

    // Only record as a change if values are actually different after normalization
    if (oldValue !== newValue) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }

  return changes;
}
