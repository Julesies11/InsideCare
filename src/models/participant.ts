import { Database } from './database.types';

export type ParticipantStatus = Database['public']['Enums']['ic_status_enum'];

export type ParticipantRow = Database['public']['Tables']['ic_participants']['Row'];

export type Participant = ParticipantRow;

// Extended interface with house details for display
export interface ParticipantWithHouse extends Participant {
  name?: string | null;
  house_name?: string | null;
}