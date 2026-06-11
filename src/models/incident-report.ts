export type IncidentStatus = 'New' | 'Actioned' | 'Referred' | 'Closed';
export type IncidentPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentSeverity = 'Low' | 'Moderate' | 'High';

export interface IncidentReport {
  id: string;
  reference_id?: string;
  incident_date: string;
  incident_type_id: string;
  involved_participant_id: string;
  involved_staff_id?: string;
  description: string;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  summary: string;
  details: string;
  outcome: string;
  witnesses?: string;
  notified_parties?: string;

  // Restrictive Practice
  is_restrictive_practice: boolean;
  restrictive_practice_type_id?: string;
  restrictive_practice_description?: string;
  rp_start_time?: string;
  rp_end_time?: string;
  rp_reason?: string;
  rp_triggers?: string;
  rp_observed_behaviours?: string;
  rp_outcome?: string;

  // Admin & NDIS
  is_ndis_reportable: boolean;
  admin_status: IncidentStatus;
  admin_actions_taken?: string;
  ndis_reported_date?: string;

  // System
  reported_by: string;
  house_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type IncidentReportInsert = Omit<
  Partial<IncidentReport>,
  'id' | 'created_at' | 'updated_at'
>;
export type IncidentReportUpdate = Partial<IncidentReport>;
