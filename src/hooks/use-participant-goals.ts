import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

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

const GOAL_COLUMNS = 'id, participant_id, goal_type, description, created_at, updated_at';
const PROGRESS_COLUMNS = 'id, goal_id, progress_note, created_at, updated_at';

export function useParticipantGoals(participantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, participantId],
    queryFn: async () => {
      if (!participantId) return { goals: [], progress: [] };

      const { data: goals, error: goalError } = await supabase
        .from(TABLES.PARTICIPANT_GOALS)
        .select(GOAL_COLUMNS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (goalError) throw goalError;

      const goalIds = goals?.map(g => g.id) || [];
      if (goalIds.length === 0) return { goals: [], progress: [] };

      const { data: progress, error: progressError } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .select(PROGRESS_COLUMNS)
        .in('goal_id', goalIds)
        .order('created_at', { ascending: true });

      if (progressError) throw progressError;

      return {
        goals: goals as ParticipantGoal[],
        progress: progress as GoalProgress[]
      };
    },
    enabled: !!participantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddParticipantGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<ParticipantGoal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOALS)
        .insert(goal)
        .select(GOAL_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to add goals for this participant");
      return data as ParticipantGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, data.participant_id] });
    },
  });
}

export function useUpdateParticipantGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ParticipantGoal> }) => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOALS)
        .update(updates)
        .eq('id', id)
        .select(GOAL_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to edit this goal");
      return data as ParticipantGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, data.participant_id] });
    },
  });
}

export function useDeleteParticipantGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, participantId }: { id: string; participantId: string }) => {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_GOALS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, variables.participantId] });
    },
  });
}

export function useAddGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ progress, participantId }: { progress: Omit<GoalProgress, 'id' | 'created_at' | 'updated_at'>; participantId: string }) => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .insert(progress)
        .select(PROGRESS_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to add progress for this goal");
      return { data: data as GoalProgress, participantId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, result.participantId] });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, progress_note, participantId }: { id: string; progress_note: string; participantId: string }) => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .update({ progress_note })
        .eq('id', id)
        .select(PROGRESS_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to edit this progress note");
      return { data: data as GoalProgress, participantId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, result.participantId] });
    },
  });
}

export function useDeleteGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, participantId }: { id: string; participantId: string }) => {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_GOAL_PROGRESS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, variables.participantId] });
    },
  });
}
