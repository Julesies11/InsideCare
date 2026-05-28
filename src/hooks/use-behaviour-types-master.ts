import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';
import { toast } from 'sonner';

export interface BehaviourTypeMaster {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useBehaviourTypesMaster() {
  return useQuery({
    queryKey: [QUERY_KEYS.BEHAVIOUR_TYPES_MASTER],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.BEHAVIOUR_TYPES_MASTER)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as BehaviourTypeMaster[];
    },
  });
}

export function useAddBehaviourTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<BehaviourTypeMaster>) => {
      const { data, error } = await supabase
        .from(TABLES.BEHAVIOUR_TYPES_MASTER)
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BEHAVIOUR_TYPES_MASTER] });
      toast.success('Behaviour type added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding behaviour type:', error);
      toast.error(error.message || 'Failed to add behaviour type');
    },
  });
}

export function useUpdateBehaviourTypeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedItem: Partial<BehaviourTypeMaster> & { id: string }) => {
      const { id, ...changes } = updatedItem;
      const { data, error } = await supabase
        .from(TABLES.BEHAVIOUR_TYPES_MASTER)
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BEHAVIOUR_TYPES_MASTER] });
      toast.success('Behaviour type updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating behaviour type:', error);
      toast.error(error.message || 'Failed to update behaviour type');
    },
  });
}
