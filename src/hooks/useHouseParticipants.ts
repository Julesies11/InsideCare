import { participantsApi } from '@/api/participants.api';
import { ParticipantListItem } from '@/models/participant';
import { useQuery } from '@tanstack/react-query';
import { STATUS } from '@/config/enums';

export function useHouseParticipants(houseId?: string) {
  const query = useQuery({
    queryKey: ['house-participants', { houseId }],
    queryFn: async () => {
      if (!houseId) return [];
      return participantsApi.listByHouse(houseId, STATUS.active);
    },
    enabled: !!houseId,
    staleTime: 0, // Real-time RLS enforcement
  });

  return {
    ...query,
    houseParticipants: (query.data || []) as ParticipantListItem[],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
