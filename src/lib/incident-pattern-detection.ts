import { subDays, isAfter } from 'date-fns';
import { INCIDENT_THRESHOLD_RULES, ThresholdRule } from '@/config/incident-thresholds';

export interface IncidentPatternAlert {
  ruleId: string;
  ruleName: string;
  triggerDescription: string;
  severity: 'High' | 'Medium' | 'Critical';
  involvedEntities: string[];
  incidentCount: number;
  periodDays: number;
  suggestedAction: string;
  incidentDates: string[];
}

/**
 * Detection engine that analyzes a list of incidents against pre-defined rules.
 * Runs entirely on the frontend using existing data.
 */
export function detectIncidentPatterns(incidents: any[]): IncidentPatternAlert[] {
  const alerts: IncidentPatternAlert[] = [];
  const now = new Date();

  INCIDENT_THRESHOLD_RULES.forEach((rule) => {
    const windowStart = subDays(now, rule.windowDays);
    
    // Filter incidents by timeframe and rule-specific criteria (type keywords)
    const relevantIncidents = incidents.filter((incident) => {
      const incidentDate = new Date(incident.incident_date);
      const isWithinWindow = isAfter(incidentDate, windowStart);
      
      if (!isWithinWindow) return false;

      // Check if incident type matches rule
      const typeName = (incident.incident_type_info?.name || incident.incident_type || '').toLowerCase();
      const matchesType = rule.incidentTypeKeywords?.some(keyword => typeName.includes(keyword.toLowerCase()));
      
      return matchesType;
    });

    if (relevantIncidents.length === 0) return;

    // Grouping logic
    let groups: Record<string, any[]> = {};

    if (rule.grouping === 'participant') {
      relevantIncidents.forEach((inc) => {
        const key = inc.involved_participant_id || 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(inc);
      });
    } else if (rule.grouping === 'type') {
      // For type grouping, we treat all relevant incidents as one group if they match the rule keywords
      const key = rule.id;
      groups[key] = relevantIncidents;
    }

    // Evaluate thresholds for each group
    Object.keys(groups).forEach((key) => {
      const groupIncidents = groups[key];
      if (groupIncidents.length >= rule.threshold) {
        const participantName = groupIncidents[0]?.participant?.participant_name || 'Multiple Participants';
        
        alerts.push({
          ruleId: rule.id,
          ruleName: rule.name,
          triggerDescription: `${groupIncidents.length} incidents detected in the last ${rule.windowDays} days.`,
          severity: rule.severity,
          involvedEntities: rule.grouping === 'participant' ? [participantName] : ['Organization-wide'],
          incidentCount: groupIncidents.length,
          periodDays: rule.windowDays,
          suggestedAction: rule.suggestedAction,
          incidentDates: groupIncidents.map(inc => inc.incident_date),
        });
      }
    });
  });

  return alerts;
}

/**
 * Generates high-level insights about incident distribution.
 */
export function generateIncidentInsights(incidents: any[]) {
  if (incidents.length === 0) return [];

  const insights: string[] = [];

  // Insight: Concentration of incidents in participants
  const participantCounts: Record<string, { name: string, count: number }> = {};
  incidents.forEach(inc => {
    if (inc.participant) {
      const id = inc.participant.id;
      if (!participantCounts[id]) {
        participantCounts[id] = { name: inc.participant.participant_name, count: 0 };
      }
      participantCounts[id].count++;
    }
  });

  const sortedParticipants = Object.values(participantCounts).sort((a, b) => b.count - a.count);
  const totalIncidents = incidents.length;

  if (sortedParticipants.length > 0) {
    const topParticipant = sortedParticipants[0];
    const topPct = Math.round((topParticipant.count / totalIncidents) * 100);
    
    if (topPct > 40 && totalIncidents > 5) {
      insights.push(`${topParticipant.name} accounts for ${topPct}% of all incidents in this period.`);
    }

    const topThreeCount = sortedParticipants.slice(0, 3).reduce((acc, curr) => acc + curr.count, 0);
    const topThreePct = Math.round((topThreeCount / totalIncidents) * 100);
    
    if (topThreePct > 60 && sortedParticipants.length > 3) {
      insights.push(`3 participants account for ${topThreePct}% of all incidents.`);
    }
  }

  // Insight: Trends (Requires more context, but basic volume insight)
  if (totalIncidents > 20) {
    insights.push(`High incident volume detected (${totalIncidents} records). Focus on pattern detection rather than totals.`);
  }

  return insights;
}
