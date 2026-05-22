import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';

export interface ParticipantProvider {
  id: string;
  participant_id: string;
  provider_name: string;
  provider_type?: string;
  provider_description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const PROVIDER_COLUMNS = 'id, participant_id, provider_name, provider_type, provider_description, is_active, created_at, updated_at';

export function useParticipantProviders(participantId?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, participantId],
    queryFn: async () => {
      if (!participantId) return [];
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_PROVIDERS)
        .select(PROVIDER_COLUMNS)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
    mutationFn: async (provider: Omit<ParticipantProvider, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_PROVIDERS)
        .insert(provider)
        .select(PROVIDER_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to add providers for this participant");
      return data as ParticipantProvider;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, data.participant_id] });
    },
  });
}

export function useUpdateParticipantProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ParticipantProvider> }) => {
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANT_PROVIDERS)
        .update(updates)
        .eq('id', id)
        .select(PROVIDER_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("You do not have permission to edit this provider");
      return data as ParticipantProvider;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, data.participant_id] });
    },
  });
}

export function useDeleteParticipantProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, participantId }: { id: string; participantId: string }) => {
      const { error } = await supabase
        .from(TABLES.PARTICIPANT_PROVIDERS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARTICIPANT_PROVIDERS, variables.participantId] });
    },
  });
}
