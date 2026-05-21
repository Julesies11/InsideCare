import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Participant, ParticipantWithHouse } from '@/models/participant';

export interface ParticipantsFilter {
  search?: string;
  houses?: string[];
  statuses?: string[];
}

export interface ParticipantsSort {
  id: string;
  desc: boolean;
}

const PARTICIPANT_LIST_COLUMNS = `
  id, participant_name, photo_url, status, house_id, ndis_number, date_of_birth,
  houses:ic_houses!house_id (
    house_name
  )
`;

const PARTICIPANT_DETAIL_COLUMNS = `
  id, participant_name, photo_url, email, house_phone, personal_mobile, address, date_of_birth, move_in_date, 
  ndis_number, house_id, status, support_level, support_coordinator, primary_diagnosis, 
  secondary_diagnosis, allergies, routine, hygiene_support, current_goals, current_medications, 
  restrictive_practices, service_providers, behaviour_of_concern, pbsp_engaged, bsp_available, 
  restrictive_practices_yn, specialist_name, specialist_phone, specialist_email, 
  restrictive_practice_authorisation, restrictive_practice_details, mtmp_required, mtmp_details, 
  mobility_support, meal_prep_support, household_support, communication_type, communication_notes, 
  communication_language_needs, finance_support, health_wellbeing_support, cultural_religious_support, 
  other_support, mental_health_plan, medical_plan, natural_disaster_plan, pharmacy_name, 
  pharmacy_contact, pharmacy_location, gp_name, gp_contact, gp_location, psychiatrist_name, 
  psychiatrist_contact, psychiatrist_location, medical_routine_other, medical_routine_general_process, 
  created_by, updated_by, created_at, updated_at,
  houses:ic_houses!house_id (
    house_name
  )
`;

export function useParticipants(
  pageIndex: number = 0,
  pageSize: number = 10,
  sort: ParticipantsSort[] = [],
  filters: ParticipantsFilter = {}
) {
  const query = useQuery({
    queryKey: ['participants', { pageIndex, pageSize, sort, filters }],
    queryFn: async () => {
      let query = supabase
        .from('ic_participants')
        .select(PARTICIPANT_LIST_COLUMNS, { count: 'exact' });

      if (filters.search) {
        query = query.or(`participant_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,ndis_number.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      if (filters.houses && filters.houses.length > 0) {
        query = query.in('house_id', filters.houses);
      }

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          const column = s.id === 'house' ? 'house_id' : (s.id === 'name' || s.id === 'participant' ? 'participant_name' : s.id);
          query = query.order(column, { ascending: !s.desc });
        });
      } else {
        query = query.order('participant_name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const participantsWithHouse = (data || []).map((p: any) => ({
        ...p,
        house_name: p.houses?.house_name || null,
      })) as ParticipantWithHouse[];

      return { data: participantsWithHouse, count: count || 0 };
    },
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
    queryFn: async () => {
      let query = supabase
        .from('ic_participants')
        .select('*', { count: 'exact', head: true });

      if (filters.houses && filters.houses.length > 0) {
        query = query.in('house_id', filters.houses);
      }

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      if (filters.search) {
        query = query.or(`participant_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,ndis_number.ilike.%${filters.search}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
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
    queryKey: ['participants', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('ic_participants')
        .select(PARTICIPANT_DETAIL_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to view this participant, or it does not exist.');
      }

      const participantWithHouse = {
        ...data,
        house_name: (data as any).houses?.house_name || null,
      };

      return participantWithHouse as ParticipantWithHouse;
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
    mutationFn: async (participant: Omit<Participant, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
      const { data, error } = await supabase
        .from('ic_participants')
        .insert([participant])
        .select(PARTICIPANT_DETAIL_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to add this participant.');
      }
      return data as Participant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Participant> }) => {
      const { data, error } = await supabase
        .from('ic_participants')
        .update(updates)
        .eq('id', id)
        .select(PARTICIPANT_DETAIL_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this participant, or it does not exist.');
      }

      const participantWithHouse = {
        ...data,
        house_name: (data as any).houses?.house_name || null,
      };

      return participantWithHouse as ParticipantWithHouse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      queryClient.invalidateQueries({ queryKey: ['participants', data.id] });
    },
  });
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ic_participants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });
}
