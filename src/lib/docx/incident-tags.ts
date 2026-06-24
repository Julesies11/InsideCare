import { TemplateTag } from './types';

export const INCIDENT_TEMPLATE_TAGS: TemplateTag[] = [
  // Incident Details
  { name: '{{reference_id}}', description: 'Incident Reference ID', category: 'Incident Details', example: 'INC-001' },
  { name: '{{incident_date}}', description: 'Date and Time of the incident', category: 'Incident Details', example: '15/05/2026, 2:30:00 pm' },
  { name: '{{incident_type}}', description: 'Incident Type', category: 'Incident Details', example: 'Fall' },
  { name: '{{priority}}', description: 'Priority level', category: 'Incident Details', example: 'Medium' },
  { name: '{{severity}}', description: 'Severity level', category: 'Incident Details', example: 'Minor' },
  { name: '{{status}}', description: 'Current status of the report', category: 'Incident Details', example: 'Under Review' },
  { name: '{{summary}}', description: 'Brief summary of the incident', category: 'Incident Details', example: 'Participant fell in the kitchen' },
  { name: '{{details}}', description: 'Detailed description of the incident', category: 'Incident Details', example: 'While reaching for a cup...' },
  
  // Involved Parties
  { name: '{{participant_name}}', description: 'Name of the involved participant', category: 'Involved Parties', example: 'John Doe' },
  { name: '{{staff_name}}', description: 'Name of the involved staff member', category: 'Involved Parties', example: 'Sarah Smith' },
  { name: '{{reporter_name}}', description: 'Name of the staff member who reported the incident', category: 'Involved Parties', example: 'Jane Miller' },
  { name: '{{house_name}}', description: 'Name of the house where incident occurred', category: 'Involved Parties', example: 'Sunshine Villa' },

  // Actions & Outcomes
  { name: '{{outcome}}', description: 'Outcome of the incident', category: 'Actions & Outcomes', example: 'GP consulted, no injuries found' },
  { name: '{{witnesses}}', description: 'Witnesses of the incident', category: 'Actions & Outcomes', example: 'Mark Connor (Support Worker)' },
  { name: '{{notified_parties}}', description: 'Parties notified of the incident', category: 'Actions & Outcomes', example: 'Guardian notified via phone at 3pm' },

  // Restrictive Practices
  { name: '{{is_restrictive_practice}}', description: 'Whether a restrictive practice was used (Yes/No)', category: 'Restrictive Practice', example: 'Yes' },
  { name: '{{restrictive_practice_type}}', description: 'Type of restrictive practice', category: 'Restrictive Practice', example: 'Environmental' },
  { name: '{{restrictive_practice_description}}', description: 'Description of the restrictive practice', category: 'Restrictive Practice', example: 'Locked front door due to immediate egress risk' },
  { name: '{{rp_start_time}}', description: 'Start date and time of restrictive practice', category: 'Restrictive Practice', example: '15/05/2026, 2:32:00 pm' },
  { name: '{{rp_end_time}}', description: 'End date and time of restrictive practice', category: 'Restrictive Practice', example: '15/05/2026, 2:45:00 pm' },
  { name: '{{rp_reason}}', description: 'Reason for the restrictive practice', category: 'Restrictive Practice', example: 'To prevent participant running into traffic' },
  { name: '{{rp_triggers}}', description: 'Triggers leading to the restrictive practice', category: 'Restrictive Practice', example: 'Loud noise from construction next door' },
  { name: '{{rp_observed_behaviours}}', description: 'Observed behaviours', category: 'Restrictive Practice', example: 'Agitated pacing and attempting to open fire exit' },
  { name: '{{rp_outcome}}', description: 'Outcome of the restrictive practice', category: 'Restrictive Practice', example: 'Participant calmed down in sensory room' },

  // NDIS Reporting & Administration
  { name: '{{is_ndis_reportable}}', description: 'Whether the incident is NDIS reportable (Yes/No)', category: 'NDIS Reporting', example: 'No' },
  { name: '{{ndis_reported_date}}', description: 'Date reported to NDIS (DD/MM/YYYY)', category: 'NDIS Reporting', example: '16/05/2026' },
  { name: '{{admin_status}}', description: 'Administrative status', category: 'NDIS Reporting', example: 'New' },
  { name: '{{admin_actions_taken}}', description: 'Administrative actions taken', category: 'NDIS Reporting', example: 'Reviewed by Operations Manager' },
];

export function mapIncidentToTags(incident: any) {
  if (!incident) return {};

  const formatBool = (val: any) => (val === true ? 'Yes' : 'No');
  const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-AU') : '-';
  const formatDateTime = (val: any) => val ? new Date(val).toLocaleString('en-AU') : '-';

  return {
    reference_id: incident.reference_id || '',
    incident_date: formatDateTime(incident.incident_date),
    incident_type: incident.incident_type_info?.name || incident.incident_type || '',
    priority: incident.priority || '',
    severity: incident.severity || '',
    status: incident.status || '',
    summary: incident.summary || '',
    details: incident.details || '',

    participant_name: incident.participant?.participant_name || '',
    staff_name: incident.staff?.staff_name || '',
    reporter_name: incident.reporter?.staff_name || '',
    house_name: incident.house?.house_name || '',

    outcome: incident.outcome || '',
    witnesses: incident.witnesses || '',
    notified_parties: incident.notified_parties || '',

    is_restrictive_practice: formatBool(incident.is_restrictive_practice),
    restrictive_practice_type: incident.restrictive_practice_type_info?.name || '',
    restrictive_practice_description: incident.restrictive_practice_description || '',
    rp_start_time: formatDateTime(incident.rp_start_time),
    rp_end_time: formatDateTime(incident.rp_end_time),
    rp_reason: incident.rp_reason || '',
    rp_triggers: incident.rp_triggers || '',
    rp_observed_behaviours: incident.rp_observed_behaviours || '',
    rp_outcome: incident.rp_outcome || '',

    is_ndis_reportable: formatBool(incident.is_ndis_reportable),
    ndis_reported_date: formatDate(incident.ndis_reported_date),
    admin_status: incident.admin_status || '',
    admin_actions_taken: incident.admin_actions_taken || '',
  };
}
