import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HouseParticipant {
  id: string;
  name: string;
  email?: string;
  status: string;
  house_id?: string;
  house_phone?: string;
  personal_mobile?: string;
  move_in_date?: string;
  created_at: string;
  updated_at: string;
}

export function useHouseParticipants(houseId?: string) {
  const query = useQuery({
    queryKey: ['house-participants', { houseId }],
    queryFn: async () => {
      if (!houseId) return [];
      
      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          name,
          email,
          status,
          house_id,
          house_phone,
          personal_mobile,
          move_in_date,
          created_at,
          updated_at
        `)
        .eq('house_id', houseId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HouseParticipant[];
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    houseParticipants: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}
