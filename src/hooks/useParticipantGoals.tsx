import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ParticipantGoal {
  id: string;
  participant_id: string;
  goal_type: 'ndis' | 'identified';
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  progress_note: string;
  created_at?: string;
  updated_at?: string;
}

export function useParticipantGoals(participantId?: string) {
  const [goals, setGoals] = useState<ParticipantGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participantId) {
      fetchGoals(participantId);
    } else {
      setLoading(false);
    }
  }, [participantId]);

  const fetchGoals = async (participantId: string) => {
    try {
      setLoading(true);

      // Fetch goals
      const { data: goalData, error: goalError } = await supabase
        .from('participant_goals')
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (goalError) throw goalError;

      setGoals(goalData || []);

      // Fetch progress notes
      const { data: progressData, error: progressError } = await supabase
        .from('participant_goal_progress')
        .select('*')
        .in('goal_id', goalData?.map(g => g.id) || [])
        .order('created_at', { ascending: true });

      if (progressError) throw progressError;

      setGoalProgress(progressData || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch goals';
      console.error('Error fetching goals:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  async function addGoal(goal: Omit<ParticipantGoal, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('participant_goals')
        .insert(goal)
        .select()
        .single();

      if (error) throw error;

      if (data) setGoals([data, ...goals]);

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add goal';
      console.error('Error adding goal:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateGoal(id: string, updates: Partial<ParticipantGoal>) {
    try {
      const { data, error } = await supabase
        .from('participant_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) setGoals(goals.map(g => g.id === id ? data : g));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update goal';
      console.error('Error updating goal:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteGoal(id: string) {
    try {
      const { error } = await supabase
        .from('participant_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== id));
      setGoalProgress(goalProgress.filter(p => p.goal_id !== id));

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete goal';
      console.error('Error deleting goal:', err);
      return { error: errorMessage };
    }
  }

  async function addProgress(progress: Omit<GoalProgress, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('participant_goal_progress')
        .insert(progress)
        .select()
        .single();

      if (error) throw error;

      if (data) setGoalProgress([...goalProgress, data]);

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add progress';
      console.error('Error adding progress:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function updateProgress(id: string, progress_note: string) {
    try {
      const { data, error } = await supabase
        .from('participant_goal_progress')
        .update({ progress_note })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) setGoalProgress(goalProgress.map(p => p.id === id ? data : p));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress note';
      console.error('Error updating progress note:', err);
      return { data: null, error: errorMessage };
    }
  }

  async function deleteProgress(id: string) {
    try {
      const { error } = await supabase
        .from('participant_goal_progress')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoalProgress(goalProgress.filter(p => p.id !== id));

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete progress note';
      console.error('Error deleting progress note:', err);
      return { error: errorMessage };
    }
  }

  return {
    goals,
    goalProgress,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    addProgress,
    updateProgress,
    deleteProgress,
    refetch: participantId ? () => fetchGoals(participantId) : () => {},
  };
}
