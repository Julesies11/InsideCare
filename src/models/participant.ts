export type ParticipantStatus = 'draft' | 'active' | 'inactive';

export interface Participant {
  id: string;
  name: string | null;
  photo_url?: string | null;
  email?: string | null;
  house_phone?: string | null;
  personal_mobile?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  ndis_number?: string | null;
  house_id?: string | null;
  status: ParticipantStatus;
  support_level?: string | null;
  support_coordinator?: string | null;
  primary_diagnosis?: string | null;
  secondary_diagnosis?: string | null;
  allergies?: string | null;
  morning_routine?: string | null;
  shower_support?: string | null;
  current_goals?: string | null;
  current_medications?: string | null;
  general_notes?: string | null;
  restrictive_practices?: string | null;
  service_providers?: string | null;
  behaviour_of_concern?: string | null;
  pbsp_engaged?: boolean | null;
  bsp_available?: boolean | null;
  restrictive_practices_yn?: boolean | null;
  specialist_name?: string | null;
  specialist_phone?: string | null;
  specialist_email?: string | null;
  restrictive_practice_authorisation?: boolean | null;
  restrictive_practice_details?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Extended interface with house details for display
export interface ParticipantWithHouse extends Participant {
  house_name?: string;
}