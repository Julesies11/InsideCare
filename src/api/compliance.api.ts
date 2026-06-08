import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { Database } from '@/models/database.types';

export type ComplianceType = Database['public']['Tables']['ic_compliance_types_master']['Row'];
export type HouseComplianceRequirement = Database['public']['Tables']['ic_house_compliance_requirements']['Row'];

export const complianceApi = {
  types: {
    async list(includeInactive = false) {
      let query = supabase
        .from(TABLES.COMPLIANCE_TYPES_MASTER)
        .select('*')
        .order('compliance_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async upsert(records: Partial<Database['public']['Tables']['ic_compliance_types_master']['Insert']> | Partial<Database['public']['Tables']['ic_compliance_types_master']['Insert']>[]) {
      const payload = Array.isArray(records) ? records : [records];
      const { data, error } = await supabase
        .from(TABLES.COMPLIANCE_TYPES_MASTER)
        .upsert(payload as any)
        .select();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.COMPLIANCE_TYPES_MASTER)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  house: {
    async listRequirements(houseId: string) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_COMPLIANCE_REQUIREMENTS)
        .select(`
          id,
          house_id,
          compliance_type_id,
          compliance_type:${TABLES.COMPLIANCE_TYPES_MASTER}!compliance_type_id(
            id,
            compliance_name,
            description,
            is_active,
            is_default_global
          )
        `)
        .eq('house_id', houseId);

      if (error) throw error;
      return data || [];
    },

    async updateRequirements(houseId: string, complianceTypeIds: string[]) {
      // 1. Delete all existing mappings for this house
      const { error: deleteError } = await supabase
        .from(TABLES.HOUSE_COMPLIANCE_REQUIREMENTS)
        .delete()
        .eq('house_id', houseId);
      
      if (deleteError) throw deleteError;

      // 2. Insert new mappings if any are selected
      if (complianceTypeIds.length > 0) {
        const payload = complianceTypeIds.map(typeId => ({
          house_id: houseId,
          compliance_type_id: typeId
        }));
        
        const { data, error } = await supabase
          .from(TABLES.HOUSE_COMPLIANCE_REQUIREMENTS)
          .insert(payload)
          .select();

        if (error) throw error;
        return data || [];
      }

      return [];
    }
  }
};
