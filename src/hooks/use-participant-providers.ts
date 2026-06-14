import { participantDetailsApi } from '@/api/participant-details.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export interface ParticipantProvider {
  id: string;
  participant_id: string;
  provider_name: string;
  provider_type?: string;
  provider_description?: string;
  company?: string;
  phone?: string;
  email?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useParticipantProviders(participantId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const data = await participantDetailsApi.providers.list(participantId);
      return data as ParticipantProvider[];
    },
    enabled: !!participantId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    providers: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useAddParticipantProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      provider: Omit<ParticipantProvider, 'id' | 'created_at' | 'updated_at'>,
    ) => {
      const data = await participantDetailsApi.providers.upsert(
        provider as any,
      );
      return (Array.isArray(data) ? data[0] : data) as ParticipantProvider;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, data.participant_id],
      });
    },
  });
}

export function useUpdateParticipantProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ParticipantProvider>;
    }) => {
      const data = await participantDetailsApi.providers.upsert({
        id,
        ...updates,
      } as any);
      return (Array.isArray(data) ? data[0] : data) as ParticipantProvider;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, data.participant_id],
      });
    },
  });
}

export function useDeleteParticipantProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      participantId,
    }: {
      id: string;
      participantId: string;
    }) => {
      await participantDetailsApi.providers.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, variables.participantId],
      });
    },
  });
}
