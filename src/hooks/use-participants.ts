import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantsApi, ParticipantsFilter, ParticipantsSort } from '@/api/participants.api';
import { Participant, ParticipantWithHouse } from '@/models/participant';
import { Database } from '@/models/database.types';
import { QUERY_KEYS } from '@/config/query-keys';

export function useParticipants(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: ParticipantsSort[] = [],
  filters: ParticipantsFilter = {}
) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANTS, { pageIndex, pageSize, sort, filters }],
    queryFn: () => participantsApi.list({ pageIndex, pageSize, sort, filters }),
    staleTime: 0, // Always re-fetch from database on visit to ensure RLS truth
  });

  return {
    ...query,
    participants: query.data?.data || [],
    count: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
  };
}

export function useParticipantsCount(filters: ParticipantsFilter = {}) {
  const query = useQuery({
    queryKey: ['participants-count', { filters }],
    queryFn: () => participantsApi.count(filters),
    staleTime: 1000 * 60, // Count can be cached longer (1 min)
  });

  return {
    count: query.data ?? 0,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
  };
}

export function useParticipant(id?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANTS, id],
    queryFn: async () => {
      if (!id) return null;
      const data = await participantsApi.get(id);
      if (!data) {
        throw new Error('You do not have permission to view this participant, or it does not exist.');
      }
      return data as unknown as ParticipantWithHouse;
    },
    enabled: !!id,
  });

  return {
    ...query,
    participant: query.data || null,
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
  };
}

export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participant: Database['public']['Tables']['ic_participants']['Insert']) => 
      participantsApi.create(participant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANTS] });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Database['public']['Tables']['ic_participants']['Update'] }) => 
      participantsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANTS, data.id] });
    },
  });
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => participantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANTS] });
    },
  });
}
