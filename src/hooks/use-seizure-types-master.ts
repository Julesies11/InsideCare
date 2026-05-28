import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';
import { toast } from 'sonner';

export interface SeizureTypeMaster {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useSeizureTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.SEIZURE_TYPES_MASTER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.SEIZURE_TYPES_MASTER)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SeizureTypeMaster[];
    },
  });
}

export function useAddSeizureTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<SeizureTypeMaster>) => {
      const { data, error } = await supabase
        .from(TABLES.SEIZURE_TYPES_MASTER)
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEIZURE_TYPES_MASTER] });
      toast.success('Seizure type added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding seizure type:', error);
      toast.error(error.message || 'Failed to add seizure type');
    },
  });
}

export function useUpdateSeizureTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedItem: Partial<SeizureTypeMaster> & { id: string }) => {
      const { id, ...changes } = updatedItem;
      const { data, error } = await supabase
        .from(TABLES.SEIZURE_TYPES_MASTER)
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEIZURE_TYPES_MASTER] });
      toast.success('Seizure type updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating seizure type:', error);
      toast.error(error.message || 'Failed to update seizure type');
    },
  });
}
