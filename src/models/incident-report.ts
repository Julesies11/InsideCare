import { Database } from './database.types';

export type IncidentReport = Database['public']['Tables']['ic_incident_reports']['Row'];
export type IncidentReportInsert = Database['public']['Tables']['ic_incident_reports']['Insert'];
export type IncidentReportUpdate = Database['public']['Tables']['ic_incident_reports']['Update'];

export type IncidentType = 
  | 'Accident'
  | 'Incident'
  | 'Medication Refusal'
  | 'Medical' 
  | 'Behavioural' 
  | 'Medication Error' 
  | 'Property Damage' 
  | 'Restrictive Practice' 
  | 'Staff Injury' 
  | 'Other';

export type IncidentStatus = 'Resolved' | 'Under Review' | 'Action Needed';
export type IncidentPriority = 'Critical' | 'High' | 'Medium' | 'Low';
