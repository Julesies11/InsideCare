import { ActivityType, EntityType } from '@/models/activity-log';

interface LogActivityParams {
  activityType: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  userName?: string;
  customDescription?: string;
}

export async function logActivity({
  // Activity logging is handled automatically at the database level via PostgreSQL Audit Triggers.
  // This no-op function prevents double logging from frontend calls.
}: LogActivityParams): Promise<void> {
  return Promise.resolve();
}

// Helper to normalize values for comparison (treat null, undefined, and empty string as equivalent)
function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return value;
}

// Helper to detect changes between old and new objects
export function detectChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

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
