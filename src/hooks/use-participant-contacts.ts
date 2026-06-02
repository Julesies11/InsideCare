import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantDetailsApi } from '@/api/participant-details.api';
import { QUERY_KEYS } from '@/config/query-keys';

export interface ParticipantContact {
  id: string;
  participant_id: string;
  contact_name: string;
  contact_type_id?: string;
  contact_type?: {
    id: string;
    contact_type_name: string;
  };
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useParticipantContacts(participantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_CONTACTS, participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const data = await participantDetailsApi.contacts.list(participantId);

      return (data || []).map(item => ({
        ...item,
        contact_type: Array.isArray(item.contact_type) ? item.contact_type[0] : item.contact_type
      })) as ParticipantContact[];
    },
    enabled: !!participantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddParticipantContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<ParticipantContact, 'id' | 'created_at' | 'updated_at'>) => {
      const data = await participantDetailsApi.contacts.upsert(contact as any);
      return (Array.isArray(data) ? data[0] : data) as ParticipantContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_CONTACTS, data.participant_id] });
    },
  });
}

export function useUpdateParticipantContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ParticipantContact> }) => {
      const data = await participantDetailsApi.contacts.upsert({ id, ...updates } as any);
      return (Array.isArray(data) ? data[0] : data) as ParticipantContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_CONTACTS, data.participant_id] });
    },
  });
}

export function useDeleteParticipantContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, participantId }: { id: string; participantId: string }) => {
      await participantDetailsApi.contacts.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_CONTACTS, variables.participantId] });
    },
  });
}
