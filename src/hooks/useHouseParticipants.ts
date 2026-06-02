import { useQuery } from '@tanstack/react-query';
import { participantsApi } from '@/api/participants.api';
import { STATUS } from '@/config/enums';
import { ParticipantListItem } from '@/models/participant';

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
