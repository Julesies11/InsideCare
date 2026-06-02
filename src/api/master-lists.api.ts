import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { MEDICATION_VIEWS, MASTER_LIST_VIEWS } from '@/config/query-views';
import { MedicationMaster } from '@/models/medication-master';
import { ContactTypeMaster } from '@/models/contact-type-master';
import { Database } from '@/models/database.types';

export type Department = Database['public']['Tables']['ic_departments']['Row'];
export type EmploymentType = Database['public']['Tables']['ic_employment_types_master']['Row'];

export interface MedicationsFilter {
  search?: string;
  category?: string;
  includeInactive?: boolean;
}

export interface MedicationsSort {
  id: string;
  desc: boolean;
}

export const masterListsApi = {
  /**
   * Medications Master
   */
  medications: {
    async list(
      pageIndex: number = 0,
      pageSize: number = 50,
      sort: MedicationsSort[] = [],
      filters: MedicationsFilter = {}
    ) {
      let query = supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select(MEDICATION_VIEWS.STANDARD, { count: 'exact' });

      if (filters.search) {
        query = query.ilike('medication_name', `%${filters.search}%`);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.includeInactive === false) {
        query = query.eq('is_active', true);
      }

      if (sort.length > 0) {
        sort.forEach(s => {
          query = query.order(s.id as any, { ascending: !s.desc });
        });
      } else {
        query = query.order('medication_name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as MedicationMaster[], count: count || 0 };
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select(MEDICATION_VIEWS.STANDARD)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as MedicationMaster;
    },

    async getCategories() {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select('category')
        .not('category', 'is', null)
        .order('category');

      if (error) throw error;
      
      const categories = Array.from(new Set(data.map(m => m.category)))
        .filter((c): c is string => !!c)
        .sort();
        
      return categories;
    },

    async create(medication: Omit<MedicationMaster, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .insert(medication)
        .select(MEDICATION_VIEWS.STANDARD)
        .maybeSingle();

      if (error) {
        if (error.code === '23505' && error.message.includes('medications_master_medication_name_key')) {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      return data as MedicationMaster;
    },

    async update(id: string, updates: Partial<MedicationMaster>) {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .update(updates)
        .eq('id', id)
        .select(MEDICATION_VIEWS.STANDARD)
        .maybeSingle();

      if (error) {
        if (error.code === '23505' && error.message.includes('medications_master_medication_name_key')) {
          throw new Error('DUPLICATE_NAME');
        }
        throw error;
      }

      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }

      return data as MedicationMaster;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    }
  },

  /**
   * Contact Types Master
   */
  contactTypes: {
    async list(includeInactive = true) {
      let query = supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .select(MASTER_LIST_VIEWS.CONTACT_TYPES)
        .order('contact_type_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContactTypeMaster[];
    },

    async create(contactType: Omit<ContactTypeMaster, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .insert(contactType)
        .select(MASTER_LIST_VIEWS.CONTACT_TYPES)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to add this contact type.');
      }
      return data as ContactTypeMaster;
    },

    async update(id: string, updates: Partial<ContactTypeMaster>) {
      const { data, error } = await supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .update(updates)
        .eq('id', id)
        .select(MASTER_LIST_VIEWS.CONTACT_TYPES)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this contact type, or it does not exist.');
      }
      return data as ContactTypeMaster;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    }
  },

  /**
   * Departments Master
   */
  departments: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .select(MASTER_LIST_VIEWS.DEPARTMENTS)
        .order('department_name', { ascending: true });

      if (error) throw error;
      return data as Department[];
    },

    async create(departmentData: Database['public']['Tables']['ic_departments']['Insert']) {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .insert([departmentData])
        .select(MASTER_LIST_VIEWS.DEPARTMENTS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      return data as Department;
    },

    async update(id: string, updates: Database['public']['Tables']['ic_departments']['Update']) {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .update(updates)
        .eq('id', id)
        .select(MASTER_LIST_VIEWS.DEPARTMENTS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to edit this department, or it does not exist.');
      }
      return data as Department;
    }
  },

  /**
   * Employment Types Master
   */
  employmentTypes: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .select(MASTER_LIST_VIEWS.EMPLOYMENT_TYPES)
        .order('employment_type_name', { ascending: true });

      if (error) throw error;
      return data as EmploymentType[];
    },

    async create(employmentTypeData: Database['public']['Tables']['ic_employment_types_master']['Insert']) {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .insert([employmentTypeData])
        .select(MASTER_LIST_VIEWS.EMPLOYMENT_TYPES)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(`You do not have permission to add this employment type.`);
      }
      return data as EmploymentType;
    },

    async update(id: string, updates: Database['public']['Tables']['ic_employment_types_master']['Update']) {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .update(updates)
        .eq('id', id)
        .select(MASTER_LIST_VIEWS.EMPLOYMENT_TYPES)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('You do not have permission to perform this action');
      }
      return data as EmploymentType;
    }
  }
};
