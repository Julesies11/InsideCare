import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ParticipantContact {
  id: string;
  participant_id: string;
  contact_name: string;
  contact_type_id?: string;
  contact_type?: {
    id: string;
    name: string;
  };
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const CONTACT_COLUMNS = `
  id,
  participant_id,
  contact_name,
  contact_type_id,
  phone,
  email,
  address,
  notes,
  is_active,
  created_at,
  updated_at,
  contact_type:contact_types_master(
    id,
    name
  )
`;

export function useParticipantContacts(participantId?: string) {
  return useQuery({
    queryKey: ['participant-contacts', participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const { data, error } = await supabase
        .from('participant_contacts')
        .select(CONTACT_COLUMNS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('participant_contacts')
        .insert(contact)
        .select(CONTACT_COLUMNS)
        .single();

      if (error) throw error;
      return data as ParticipantContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['participant-contacts', data.participant_id] });
    },
  });
}

export function useUpdateParticipantContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ParticipantContact> }) => {
      const { data, error } = await supabase
        .from('participant_contacts')
        .update(updates)
        .eq('id', id)
        .select(CONTACT_COLUMNS)
        .single();

      if (error) throw error;
      return data as ParticipantContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['participant-contacts', data.participant_id] });
    },
  });
}

export function useDeleteParticipantContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, participantId }: { id: string; participantId: string }) => {
      const { error } = await supabase
        .from('participant_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['participant-contacts', variables.participantId] });
    },
  });
}
