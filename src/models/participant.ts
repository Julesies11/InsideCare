import type { participantsApi } from '@/api/participants.api';
import { Database } from './database.types';

export type ParticipantStatus = Database['public']['Enums']['ic_status_enum'];

export type ParticipantRow =
  Database['public']['Tables']['ic_participants']['Row'];

/**
 * Base Participant type derived from the database row.
 */
export type Participant = ParticipantRow;

/**
 * Inferred Participant type from the DAL's list view.
 * This automatically includes any joined fields like 'house_name'.
 */
export type ParticipantListItem = Awaited<
  ReturnType<typeof participantsApi.list>
>['data'][0];

/**
 * Inferred Participant type from the DAL's detail view.
 */
export type ParticipantDetail = NonNullable<
  Awaited<ReturnType<typeof participantsApi.get>>
>;

// Legacy support (to be phased out in favor of inferred types)
export type ParticipantWithHouse = ParticipantListItem;
