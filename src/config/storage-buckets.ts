/**
 * Centralized storage bucket names.
 * All buckets are prefixed with 'ic_' as per project standards.
 * Bucket names often use hyphens while table names use underscores.
 */
export const STORAGE_BUCKETS = {
  STAFF_DOCUMENTS: 'ic_staff_documents',
  PARTICIPANT_DOCUMENTS: 'ic_participant_documents',
  HOUSE_DOCUMENTS: 'ic_house_documents',
  CHECKLIST_ATTACHMENTS: 'ic_checklist_attachments',
  STAFF_PHOTOS: 'ic_staff_photos',
  PARTICIPANT_PHOTOS: 'ic_participant_photos',
  HOUSE_RESOURCES: 'ic_house_resources',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];
