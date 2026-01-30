/**
 * Factory functions for creating pending changes trackers
 * Provides a consistent structure for tracking add/update/delete operations
 */

import { PendingChanges, emptyPendingChanges, hasPendingChanges } from '@/models/pending-changes';

/**
 * Creates the complete pending changes structure for all child entities
 * Uses the existing PendingChanges type for consistency
 */
export function createPendingChanges(): PendingChanges {
  return JSON.parse(JSON.stringify(emptyPendingChanges));
}

/**
 * Checks if any child entity has pending changes
 * Re-exports the existing helper for convenience
 */
export function hasAnyPendingChanges(pendingChanges: PendingChanges): boolean {
  return hasPendingChanges(pendingChanges);
}

/**
 * Resets all pending changes to empty state
 */
export function resetPendingChanges(): PendingChanges {
  return createPendingChanges();
}
