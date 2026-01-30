import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface ActivityLog {
  id: string;
  activity_type: 'create' | 'update' | 'delete';
  entity_type: 'participant' | 'staff' | 'incident' | 'compliance' | 'shift_note' | 'branch';
  entity_id: string;
  entity_name?: string;
  description: string;
  user_name?: string;
  metadata?: any;
  created_at: string;
}

export function useActivityLog() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities(limit = 10) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setActivities(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }

  async function logActivity(activity: Omit<ActivityLog, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .insert([activity])
        .select()
        .single();

      if (error) throw error;

      // Add to local state for immediate UI update
      setActivities([data, ...activities]);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log activity';
      console.error('Error logging activity:', err);
      return { data: null, error: errorMessage };
    }
  }

  // Helper functions for common activities
  async function logParticipantActivity(
    type: 'create' | 'update' | 'delete',
    participantId: string,
    participantName: string,
    userName?: string
  ) {
    const descriptions = {
      create: `New participant added: ${participantName}`,
      update: `Participant updated: ${participantName}`,
      delete: `Participant removed: ${participantName}`
    };

    return logActivity({
      activity_type: type,
      entity_type: 'participant',
      entity_id: participantId,
      entity_name: participantName,
      description: descriptions[type],
      user_name: userName
    });
  }

  async function logStaffActivity(
    type: 'create' | 'update' | 'delete',
    staffId: string,
    staffName: string,
    userName?: string
  ) {
    const descriptions = {
      create: `New staff member added: ${staffName}`,
      update: `Staff member updated: ${staffName}`,
      delete: `Staff member removed: ${staffName}`
    };

    return logActivity({
      activity_type: type,
      entity_type: 'staff',
      entity_id: staffId,
      entity_name: staffName,
      description: descriptions[type],
      user_name: userName
    });
  }

  async function logIncidentActivity(
    type: 'create' | 'update' | 'delete',
    incidentId: string,
    incidentType: string,
    userName?: string
  ) {
    const descriptions = {
      create: `New incident reported: ${incidentType}`,
      update: `Incident updated: ${incidentType}`,
      delete: `Incident removed: ${incidentType}`
    };

    return logActivity({
      activity_type: type,
      entity_type: 'incident',
      entity_id: incidentId,
      entity_name: incidentType,
      description: descriptions[type],
      user_name: userName
    });
  }

  async function logComplianceActivity(
    type: 'create' | 'update' | 'delete',
    complianceId: string,
    complianceName: string,
    staffName: string,
    userName?: string
  ) {
    const descriptions = {
      create: `Compliance added for ${staffName}: ${complianceName}`,
      update: `Compliance updated for ${staffName}: ${complianceName}`,
      delete: `Compliance removed for ${staffName}: ${complianceName}`
    };

    return logActivity({
      activity_type: type,
      entity_type: 'compliance',
      entity_id: complianceId,
      entity_name: complianceName,
      description: descriptions[type],
      user_name: userName,
      metadata: { staff_name: staffName }
    });
  }

  async function logShiftNoteActivity(
    type: 'create' | 'update' | 'delete',
    noteId: string,
    summary: string,
    userName?: string
  ) {
    const descriptions = {
      create: `New shift note added: ${summary}`,
      update: `Shift note updated: ${summary}`,
      delete: `Shift note removed: ${summary}`
    };

    return logActivity({
      activity_type: type,
      entity_type: 'shift_note',
      entity_id: noteId,
      entity_name: summary,
      description: descriptions[type],
      user_name: userName
    });
  }

  async function logBranchActivity(
    type: 'create' | 'update' | 'delete',
    branchId: string,
    branchName: string,
    userName?: string
  ) {
    const descriptions = {
      create: `New branch added: ${branchName}`,
      update: `Branch updated: ${branchName}`,
      delete: `Branch deleted: ${branchName}`
    };

    return logActivity({
      activity_type: type,
      entity_type: 'branch',
      entity_id: branchId,
      entity_name: branchName,
      description: descriptions[type],
      user_name: userName
    });
  }

  async function logProviderActivity(
    type: 'create' | 'update' | 'delete',
    providerId: string,
    description: string,
    userName?: string
  ) {
    return logActivity({
      activity_type: type,
      entity_type: 'participant', // Using 'participant' as entity_type since 'provider' isn't in the type union
      entity_id: providerId,
      description: description,
      user_name: userName
    });
  }

  return {
    activities,
    loading,
    error,
    logActivity,
    logParticipantActivity,
    logStaffActivity,
    logIncidentActivity,
    logComplianceActivity,
    logShiftNoteActivity,
    logBranchActivity,
    logProviderActivity,
    refetch: fetchActivities
  };
}
