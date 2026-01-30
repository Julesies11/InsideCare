import { useMemo } from 'react';
import { diff } from 'json-diff-ts';
import { hasAnyPendingChanges } from '@/lib/pending-changes-factory';
import { PendingChanges } from '@/models/pending-changes';

interface UseDirtyTrackerOptions {
  formData: any;
  originalData: any;
  pendingChanges?: PendingChanges;
}

/**
 * Centralized hook for tracking dirty state across form and child entities
 * Uses json-diff-ts for reliable deep comparison instead of JSON.stringify
 */
export function useDirtyTracker({ formData, originalData, pendingChanges }: UseDirtyTrackerOptions) {
  return useMemo(() => {
    // Check if main form has changes using json-diff-ts
    const formDiff = diff(originalData, formData);
    const formChanged = formDiff.length > 0;

    // Check if any child entities have pending changes
    const hasPendingChildChanges = pendingChanges ? hasAnyPendingChanges(pendingChanges) : false;

    return {
      isDirty: formChanged || hasPendingChildChanges,
      formChanged,
      hasPendingChildChanges,
      formDiff, // Expose diff for debugging or detailed change tracking
    };
  }, [formData, originalData, pendingChanges]);
}
