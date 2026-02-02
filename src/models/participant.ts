export type ParticipantStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface Participant {
  id: string;
  name: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  ndis_number?: string | null;
  house_id?: string | null;
  status: ParticipantStatus;
  is_active?: boolean;
  support_level?: string | null;
  support_coordinator?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_conditions?: string | null;
  allergies?: string | null;
  morning_routine?: string | null;
  shower_support?: string | null;
  current_goals?: string | null;
  current_medications?: string | null;
  general_notes?: string | null;
  restrictive_practices?: string | null;
  service_providers?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Extended interface with house details for display
export interface ParticipantWithHouse extends Participant {
  house_name?: string;
}