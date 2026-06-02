import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shiftTemplatesApi } from '@/api/shift-templates.api';
import { QUERY_KEYS } from '@/config/query-keys';

export interface HouseShiftTemplate {
  id: string;
  house_id: string;
  shift_template_name: string;
  short_name?: string;
  icon_name?: string;
  color_theme?: string;
  default_start_time?: string;
  default_end_time?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftTemplateDefaultChecklist {
  shift_template_id: string;
  checklist_id: string;
  checklist?: {
    id: string;
    house_checklist_name: string;
    description: string;
    items?: Array<{ id: string; title: string; sort_order: number }>;
  };
}

export function useHouseShiftTemplates(houseId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEYS.HOUSE_SHIFT_TEMPLATES, houseId],
    queryFn: async () => {
      if (!houseId) return { types: [], defaults: [] };
      return await shiftTemplatesApi.listWithDefaults(houseId);
    },
    enabled: !!houseId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const createShiftTemplate = useMutation({
    mutationFn: async (shiftTemplate: Partial<HouseShiftTemplate> & { default_checklists?: string[] }) => {
      return await shiftTemplatesApi.upsert(shiftTemplate, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_SHIFT_TEMPLATES, houseId] });
      toast.success('Shift template created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create shift template: ${error.message}`);
    }
  });

  const updateShiftTemplate = useMutation({
    mutationFn: async (shiftTemplate: Partial<HouseShiftTemplate> & { id: string, default_checklists?: string[] }) => {
      return await shiftTemplatesApi.upsert(shiftTemplate, shiftTemplate.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_SHIFT_TEMPLATES, houseId] });
      toast.success('Shift template updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update shift template: ${error.message}`);
    }
  });

  const deleteShiftTemplate = useMutation({
    mutationFn: async (id: string) => {
      await shiftTemplatesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOUSE_SHIFT_TEMPLATES, houseId] });
      toast.success('Shift template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete shift template: ${error.message}`);
    }
  });

  return useMemo(() => ({
    ...query,
    shiftTemplates: query.data?.types || [],
    defaults: query.data?.defaults || [],
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate
  }), [query, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate]);
}
