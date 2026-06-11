import { useMemo } from 'react';
import {
  hasHousePendingChanges,
  HousePendingChanges,
} from '@/models/house-pending-changes';
import {
  hasParticipantPendingChanges,
  ParticipantPendingChanges,
} from '@/models/participant-pending-changes';
import {
  hasStaffPendingChanges,
  StaffPendingChanges,
} from '@/models/staff-pending-changes';
import { diff } from 'json-diff-ts';

interface UseDirtyTrackerOptions {
  formData: any;
  originalData: any;
  pendingChanges?:
    | StaffPendingChanges
    | ParticipantPendingChanges
    | HousePendingChanges;
}

/**
 * Centralized hook for tracking dirty state across form and child entities
 * Uses json-diff-ts for reliable deep comparison instead of JSON.stringify
 */
export function useDirtyTracker({
  formData,
  originalData,
  pendingChanges,
}: UseDirtyTrackerOptions) {
  return useMemo(() => {
    // Check if main form has changes using json-diff-ts
    const formDiff = diff(originalData, formData);
    const formChanged = formDiff.length > 0;

    // Check if any child entities have pending changes
    let hasPendingChildChanges = false;
    if (pendingChanges) {
      // Check if it's StaffPendingChanges (has training property)
      if ('training' in pendingChanges) {
        hasPendingChildChanges = hasStaffPendingChanges(
          pendingChanges as StaffPendingChanges,
        );
      } else if ('participants' in pendingChanges) {
        // Check if it's HousePendingChanges (has participants property)
        hasPendingChildChanges = hasHousePendingChanges(
          pendingChanges as HousePendingChanges,
        );
      } else {
        // Otherwise, treat as ParticipantPendingChanges
        hasPendingChildChanges = hasParticipantPendingChanges(
          pendingChanges as ParticipantPendingChanges,
        );
      }
    }

    return {
      isDirty: formChanged || hasPendingChildChanges,
      formChanged,
      hasPendingChildChanges,
      formDiff, // Expose diff for debugging or detailed change tracking
    };
  }, [formData, originalData, pendingChanges]);
}
