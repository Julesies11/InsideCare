/**
 * Centralized storage bucket names.
 * All buckets are prefixed with 'ic_' as per project standards.
 * Bucket names often use hyphens while table names use underscores.
 */
export const STORAGE_BUCKETS = {
  STAFF_DOCUMENTS: 'ic_staff-documents',
  PARTICIPANT_DOCUMENTS: 'ic_participant-documents',
  HOUSE_DOCUMENTS: 'ic_house_documents',
  CHECKLIST_ATTACHMENTS: 'ic_checklist-attachments',
  STAFF_PHOTOS: 'ic_staff-photos',
  PARTICIPANT_PHOTOS: 'ic_participant-photos',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];
