/**
 * Configuration for incident pattern detection thresholds.
 * These rules define when the system should flag a "Pattern Alert" based on
 * rolling time windows and grouped incident data.
 */

export interface ThresholdRule {
  id: string;
  name: string;
  incidentTypeId?: string; // Optional: specific to a type
  incidentTypeKeywords?: string[]; // Optional: keywords in the type name if ID isn't known
  threshold: number;
  windowDays: number; // e.g., 30 for monthly, 90 for quarterly
  grouping: 'participant' | 'type' | 'location' | 'medication' | 'staff';
  severity: 'High' | 'Medium' | 'Critical';
  suggestedAction: string;
}

export const INCIDENT_THRESHOLD_RULES: ThresholdRule[] = [
  {
    id: 'behaviour-pattern',
    name: 'Behaviour of Concern Pattern',
    incidentTypeKeywords: ['behaviour'],
    threshold: 3,
    windowDays: 30,
    grouping: 'participant',
    severity: 'High',
    suggestedAction: 'Review BSP (Behaviour Support Plan), staffing levels, and environment.',
  },
  {
    id: 'med-error-staff',
    name: 'Medication Error Pattern',
    incidentTypeKeywords: ['medication error'],
    threshold: 2,
    windowDays: 90, // Quarterly
    grouping: 'type',
    severity: 'Critical',
    suggestedAction: 'Review medication administration processes and staff training.',
  },
  {
    id: 'med-refusal-pattern',
    name: 'Repeated Medication Refusal',
    incidentTypeKeywords: ['medication refusal'],
    threshold: 3,
    windowDays: 30,
    grouping: 'participant',
    severity: 'High',
    suggestedAction: 'Review medication necessity with GP and clinical manager.',
  },
  {
    id: 'accident-cluster',
    name: 'Accident/Injury Cluster',
    incidentTypeKeywords: ['accident', 'injury'],
    threshold: 2,
    windowDays: 30,
    grouping: 'participant',
    severity: 'High',
    suggestedAction: 'Perform environment safety audit and mobility review.',
  },
  {
    id: 'near-miss-pattern',
    name: 'Repeated Near Misses',
    incidentTypeKeywords: ['near miss'],
    threshold: 5,
    windowDays: 90,
    grouping: 'type',
    severity: 'Medium',
    suggestedAction: 'Review safety protocols to prevent near misses from becoming incidents.',
  },
  {
    id: 'complaint-immediate',
    name: 'Confirmed Complaint',
    incidentTypeKeywords: ['complaint'],
    threshold: 1,
    windowDays: 365, // Any complaint is flagged
    grouping: 'type',
    severity: 'High',
    suggestedAction: 'Follow internal grievance procedures and action mitigations.',
  },
];
