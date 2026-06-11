import { participantDetailsApi } from '@/api/participant-details.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useParticipantGoals(participantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, participantId],
    queryFn: async () => {
      if (!participantId) return { goals: [], progress: [] };

      const goals = await participantDetailsApi.goals.list(participantId);
      const goalIds = goals?.map((g) => g.id) || [];

      if (goalIds.length === 0) return { goals: [], progress: [] };

      const progress = await participantDetailsApi.goals.listProgress(goalIds);

      return {
        goals: goals as ParticipantGoal[],
        progress: progress as GoalProgress[],
      };
    },
    enabled: !!participantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddParticipantGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      goal: Omit<ParticipantGoal, 'id' | 'created_at' | 'updated_at'>,
    ) => {
      const data = await participantDetailsApi.goals.upsert(goal as any);
      return (Array.isArray(data) ? data[0] : data) as ParticipantGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, data.participant_id],
      });
    },
  });
}

export function useUpdateParticipantGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ParticipantGoal>;
    }) => {
      const data = await participantDetailsApi.goals.upsert({
        id,
        ...updates,
      } as any);
      return (Array.isArray(data) ? data[0] : data) as ParticipantGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, data.participant_id],
      });
    },
  });
}

export function useDeleteParticipantGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      participantId,
    }: {
      id: string;
      participantId: string;
    }) => {
      await participantDetailsApi.goals.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, variables.participantId],
      });
    },
  });
}

export function useAddGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      progress,
      participantId,
    }: {
      progress: Omit<GoalProgress, 'id' | 'created_at' | 'updated_at'>;
      participantId: string;
    }) => {
      const data = await participantDetailsApi.goals.createProgress(
        progress as any,
      );
      return { data: data as GoalProgress, participantId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, result.participantId],
      });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      progress_note,
      participantId,
    }: {
      id: string;
      progress_note: string;
      participantId: string;
    }) => {
      const data = await participantDetailsApi.goals.updateProgress(
        id,
        progress_note,
      );
      return { data: data as GoalProgress, participantId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, result.participantId],
      });
    },
  });
}

export function useDeleteGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      participantId,
    }: {
      id: string;
      participantId: string;
    }) => {
      await participantDetailsApi.goals.deleteProgress(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_GOALS, variables.participantId],
      });
    },
  });
}
