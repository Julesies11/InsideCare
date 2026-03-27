import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ShiftTypeDefaultChecklist {
  id: string;
  shift_type_id: string;
  checklist_id: string;
  checklist?: {
    id: string;
    name: string;
    items?: Array<{
      id: string;
      title: string;
      sort_order: number;
    }>;
  };
}

export interface ShiftTemplateGroup {
  id: string;
  house_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  items?: ShiftTemplateItem[];
}

export interface ShiftTemplateItem {
  id: string;
  template_group_id: string;
  shift_type_id: string;
  start_time: string;
  end_time: string;
  shift_type?: {
    name: string;
    color_theme: string;
  };
  checklists?: ShiftTemplateItemChecklist[];
}

export interface ShiftTemplateItemChecklist {
  id: string;
  shift_template_item_id: string;
  checklist_id: string;
  checklist?: {
    id: string;
    name: string;
  };
}

export interface ShiftTemplateSchedule {
  id: string;
  template_group_id: string;
  house_id: string;
  rrule: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  template_group?: {
    name: string;
  };
}

export function useShiftTemplates(houseId?: string) {
  const queryClient = useQueryClient();

  // 1. Fetch Default Checklists for Shift Types
  const defaultsQuery = useQuery({
    queryKey: ['shift-type-defaults', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      const { data, error } = await supabase
        .from('shift_type_default_checklists')
        .select(`
          *,
          checklist:house_checklists(
            id, 
            name,
            items:house_checklist_items(
              id,
              title,
              sort_order
            )
          )
        `)
        .in('shift_type_id', (await supabase.from('house_shift_types').select('id').eq('house_id', houseId)).data?.map(s => s.id) || []);
      
      if (error) throw error;
      
      // Sort items by sort_order
      const processedData = (data as any[]).map(d => ({
        ...d,
        checklist: d.checklist ? {
          ...d.checklist,
          items: d.checklist.items?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        } : null
      }));

      return processedData as ShiftTypeDefaultChecklist[];
    },
    enabled: !!houseId && houseId !== 'all',
  });

  // 2. Fetch Template Groups with items and overrides
  const groupsQuery = useQuery({
    queryKey: ['shift-template-groups', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      const { data, error } = await supabase
        .from('shift_template_groups')
        .select(`
          *,
          items:shift_template_items(
            *,
            shift_type:house_shift_types(name, color_theme),
            checklists:shift_template_item_checklists(
              *,
              checklist:house_checklists(id, name)
            )
          )
        `)
        .eq('house_id', houseId)
        .order('name');

      if (error) throw error;
      return data as ShiftTemplateGroup[];
    },
    enabled: !!houseId && houseId !== 'all',
  });

  // 3. Fetch Schedules
  const schedulesQuery = useQuery({
    queryKey: ['shift-template-schedules', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      const { data, error } = await supabase
        .from('shift_template_schedules')
        .select(`
          *,
          template_group:shift_template_groups(name)
        `)
        .eq('house_id', houseId);

      if (error) throw error;
      return data as ShiftTemplateSchedule[];
    },
    enabled: !!houseId && houseId !== 'all',
  });

  // Mutations
  const createGroup = useMutation({
    mutationFn: async (group: Partial<ShiftTemplateGroup>) => {
      const { data, error } = await supabase
        .from('shift_template_groups')
        .insert({ ...group, house_id: houseId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-template-groups', houseId] })
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shift_template_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-template-groups', houseId] })
  });

  const upsertItem = useMutation({
    mutationFn: async ({ item, checklistIds }: { item: Partial<ShiftTemplateItem>, checklistIds?: string[] }) => {
      const { data: savedItem, error } = await supabase
        .from('shift_template_items')
        .upsert(item)
        .select()
        .single();
      
      if (error) throw error;

      if (checklistIds) {
        // Replace overrides
        await supabase.from('shift_template_item_checklists').delete().eq('shift_template_item_id', savedItem.id);
        if (checklistIds.length > 0) {
          const toInsert = checklistIds.map(cId => ({
            shift_template_item_id: savedItem.id,
            checklist_id: cId
          }));
          const { error: clError } = await supabase.from('shift_template_item_checklists').insert(toInsert);
          if (clError) throw clError;
        }
      }
      return savedItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-template-groups', houseId] })
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shift_template_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-template-groups', houseId] })
  });

  const updateDefaults = useMutation({
    mutationFn: async ({ shiftTypeId, checklistIds }: { shiftTypeId: string, checklistIds: string[] }) => {
      await supabase.from('shift_type_default_checklists').delete().eq('shift_type_id', shiftTypeId);
      if (checklistIds.length > 0) {
        const toInsert = checklistIds.map(cId => ({
          shift_type_id: shiftTypeId,
          checklist_id: cId
        }));
        const { error } = await supabase.from('shift_type_default_checklists').insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-type-defaults', houseId] })
  });

  const createSchedule = useMutation({
    mutationFn: async (schedule: Partial<ShiftTemplateSchedule>) => {
      const { data, error } = await supabase
        .from('shift_template_schedules')
        .insert({ ...schedule, house_id: houseId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-template-schedules', houseId] })
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shift_template_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shift-template-schedules', houseId] })
  });

  return {
    defaults: defaultsQuery.data || [],
    groups: groupsQuery.data || [],
    schedules: schedulesQuery.data || [],
    isLoading: defaultsQuery.isLoading || groupsQuery.isLoading || schedulesQuery.isLoading,
    createGroup,
    deleteGroup,
    upsertItem,
    deleteItem,
    updateDefaults,
    createSchedule,
    deleteSchedule
  };
}
