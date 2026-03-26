import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OrgShiftTemplate {
  id: string;
  name: string;
  short_name: string | null;
  start_time_default: string | null;
  end_time_default: string | null;
  icon_name: string | null;
  color_theme: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  default_checklists?: string[]; // IDs of master checklists
}

export function useOrgShiftTemplates() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['org-shift-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_shift_templates')
        .select(`
          *,
          default_checklists:org_shift_template_checklists(checklist_master_id)
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(t => ({
        ...t,
        default_checklists: t.default_checklists?.map((cl: any) => cl.checklist_master_id) || []
      })) as OrgShiftTemplate[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Partial<OrgShiftTemplate>) => {
      const { default_checklists, ...baseData } = template;
      
      const { data, error } = await supabase
        .from('org_shift_templates')
        .insert([baseData])
        .select()
        .single();
      
      if (error) throw error;

      if (default_checklists && default_checklists.length > 0) {
        const links = default_checklists.map(clId => ({
          org_shift_template_id: data.id,
          checklist_master_id: clId
        }));
        const { error: linkError } = await supabase
          .from('org_shift_template_checklists')
          .insert(links);
        if (linkError) throw linkError;
      }

      return data as OrgShiftTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-shift-templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OrgShiftTemplate> }) => {
      const { default_checklists, ...baseData } = updates;
      
      // Update base data if provided
      if (Object.keys(baseData).length > 0) {
        const { error } = await supabase
          .from('org_shift_templates')
          .update({ ...baseData, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      }

      // Sync checklists if provided
      if (default_checklists !== undefined) {
        // Simple approach: delete existing and re-insert
        await supabase
          .from('org_shift_template_checklists')
          .delete()
          .eq('org_shift_template_id', id);

        if (default_checklists.length > 0) {
          const links = default_checklists.map(clId => ({
            org_shift_template_id: id,
            checklist_master_id: clId
          }));
          const { error: linkError } = await supabase
            .from('org_shift_template_checklists')
            .insert(links);
          if (linkError) throw linkError;
        }
      }

      return { id } as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-shift-templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_shift_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-shift-templates'] });
    },
  });

  return {
    ...query,
    templates: query.data || [],
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
