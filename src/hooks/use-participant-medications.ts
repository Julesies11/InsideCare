import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantDetailsApi } from '@/api/participant-details.api';
import { QUERY_KEYS } from '@/config/query-keys';

export interface ParticipantMedication {
  id: string;
  participant_id: string;
  medication_id: string;
  medication?: {
    id: string;
    medication_name: string;
    brand_name?: string;
    medication_type?: {
      id: string;
      medication_type_name: string;
    };
  };
  dosage?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useParticipantMedications(participantId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_MEDICATIONS, participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const data = await participantDetailsApi.medications.list(participantId);

      return (data || []).map(item => ({
        ...item,
        medication: Array.isArray(item.medication_info) ? item.medication_info[0] : item.medication_info
      })) as ParticipantMedication[];
    },
    enabled: !!participantId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    medications: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refresh: query.refetch,
  };
}

export function useAddParticipantMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medication: Omit<ParticipantMedication, 'id' | 'created_at' | 'updated_at'>) => {
      const data = await participantDetailsApi.medications.upsert(medication as any);
      return (Array.isArray(data) ? data[0] : data) as ParticipantMedication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_MEDICATIONS, data.participant_id] });
    },
  });
}

export function useUpdateParticipantMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ParticipantMedication> }) => {
      const data = await participantDetailsApi.medications.upsert({ id, ...updates } as any);
      return (Array.isArray(data) ? data[0] : data) as ParticipantMedication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_MEDICATIONS, data.participant_id] });
    },
  });
}

export function useDeleteParticipantMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, participantId }: { id: string; participantId: string }) => {
      await participantDetailsApi.medications.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_MEDICATIONS, variables.participantId] });
    },
  });
}
