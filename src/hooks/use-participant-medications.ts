import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export interface ParticipantMedication {
  id: string;
  participant_id: string;
  medication_id: string;
  medication?: {
    id: string;
    medication_name: string;
    category?: string;
    common_dosages?: string;
  };
  dosage?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const PARTICIPANT_MEDICATION_COLUMNS = `
  id,
  participant_id,
  medication_id,
  dosage,
  is_active,
  created_at,
  updated_at,
  medication:ic_medications_master(
    id,
    medication_name,
    category,
    common_dosages
  )
`;

export function useParticipantMedications(participantId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_MEDICATIONS, participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_MEDICATIONS)
        .select(PARTICIPANT_MEDICATION_COLUMNS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        medication: Array.isArray(item.medication) ? item.medication[0] : item.medication
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
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_MEDICATIONS)
        .insert(medication)
        .select(PARTICIPANT_MEDICATION_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to add medications for this participant");
      return data as ParticipantMedication;
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
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_MEDICATIONS)
        .update(updates)
        .eq('id', id)
        .select(PARTICIPANT_MEDICATION_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to edit this medication");
      return data as ParticipantMedication;
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
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_MEDICATIONS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_MEDICATIONS, variables.participantId] });
    },
  });
}
