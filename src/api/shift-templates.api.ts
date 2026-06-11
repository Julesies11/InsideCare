import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

/**
 * Data Access Layer (DAL) for House Shift Templates.
 */
export const shiftTemplatesApi = {
  /**
   * List shift templates for a house.
   */
  async list(houseId: string) {
    const { data, error } = await supabase
      .from(TABLES.HOUSE_SHIFT_TEMPLATES)
      .select('*')
      .eq('house_id', houseId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * List shift templates with their default checklists.
   */
  async listWithDefaults(houseId: string) {
    const types = await this.list(houseId);
    if (!types.length) return { types: [], defaults: [] };

    const typeIds = types.map((t) => t.id);
    const { data: defaults, error } = await supabase
      .from(TABLES.SHIFT_TEMPLATE_DEFAULT_CHECKLISTS)
      .select(
        `
        *,
        checklist:${TABLES.HOUSE_CHECKLISTS}(
          id, 
          house_checklist_name, 
          description, 
          items:${TABLES.HOUSE_CHECKLIST_ITEMS}(id, title, sort_order)
        )
      `,
      )
      .in('shift_template_id', typeIds);

    if (error) throw error;

    return {
      types,
      defaults: defaults || [],
    };
  },

  /**
   * Upserts a shift template and its default checklists.
   */
  async upsert(payload: any, id?: string) {
    const { default_checklists, ...dbPayload } = payload;

    let result;
    if (id) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_SHIFT_TEMPLATES)
        .update(dbPayload)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_SHIFT_TEMPLATES)
        .insert([dbPayload])
        .select()
        .maybeSingle();
      if (error) throw error;
      result = data;
    }

    if (result && default_checklists !== undefined) {
      await this.syncDefaultChecklists(result.id, default_checklists);
    }

    return result;
  },

  /**
   * Deletes a shift template.
   */
  async delete(id: string) {
    const { error } = await supabase
      .from(TABLES.HOUSE_SHIFT_TEMPLATES)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Synchronizes default checklists for a shift template.
   */
  async syncDefaultChecklists(templateId: string, checklistIds: string[]) {
    await supabase
      .from(TABLES.SHIFT_TEMPLATE_DEFAULT_CHECKLISTS)
      .delete()
      .eq('shift_template_id', templateId);

    if (checklistIds.length > 0) {
      const { error } = await supabase
        .from(TABLES.SHIFT_TEMPLATE_DEFAULT_CHECKLISTS)
        .insert(
          checklistIds.map((clId) => ({
            shift_template_id: templateId,
            checklist_id: clId,
          })),
        );
      if (error) throw error;
    }
  },

  /**
   * Imports shift templates from another house.
   */
  async importFromHouse(targetHouseId: string, sourceHouseId: string) {
    const { data: sourceTemplates, error } = await supabase
      .from(TABLES.HOUSE_SHIFT_TEMPLATES)
      .select('*')
      .eq('house_id', sourceHouseId);

    if (error) throw error;
    if (!sourceTemplates?.length) return 0;

    const toInsert = sourceTemplates.map((st) => ({
      ...st,
      id: undefined,
      house_id: targetHouseId,
      created_at: undefined,
      updated_at: undefined,
      created_by: undefined,
      updated_by: undefined,
    }));

    const { data: newTemplates, error: insertError } = await supabase
      .from(TABLES.HOUSE_SHIFT_TEMPLATES)
      .insert(toInsert)
      .select('id');

    if (insertError) throw insertError;
    return newTemplates?.length || 0;
  },
};
