import { ContactTypeMaster } from '@/models/contact-type-master';
import { Database } from '@/models/database.types';
import { MedicationMaster } from '@/models/medication-master';
import { TABLES, TableName } from '@/config/db-tables';
import { MASTER_LIST_VIEWS, MEDICATION_VIEWS } from '@/config/query-views';
import { supabase } from '@/lib/supabase';

export type Department = Database['public']['Tables']['ic_departments']['Row'];
export type EmploymentType =
  Database['public']['Tables']['ic_employment_types_master']['Row'];

export interface MedicationType {
  id: string;
  medication_type_name: string;
  is_active: boolean;
}

export interface MedicationsFilter {
  search?: string;
  typeId?: string;
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
      filters: MedicationsFilter = {},
    ) {
      let query = supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .select(MEDICATION_VIEWS.STANDARD, { count: 'exact' });

      if (filters.search) {
        // Search Generic, Brand Name, or Side Effects (Visible columns across all contexts)
        query = query.or(
          `medication_name.ilike.%${filters.search}%,brand_name.ilike.%${filters.search}%,side_effects.ilike.%${filters.search}%`,
        );
      }

      if (filters.typeId && filters.typeId !== 'all') {
        query = query.eq('type_id', filters.typeId);
      }

      if (filters.includeInactive !== true) {
        query = query.eq('is_active', true);
      }

      if (sort.length > 0) {
        sort.forEach((s) => {
          // If sorting by category/type name, we need to handle the join or just sort by the FK ID for now
          // Typically Metronic sort.id matches the column name.
          const sortId = s.id === 'category' ? 'type_id' : s.id;
          query = query.order(sortId as any, { ascending: !s.desc });
        });
      } else {
        query = query.order('medication_name', { ascending: true });
      }

      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data || []) as MedicationMaster[], count: count || 0 };
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

    async getMedicationTypes(includeInactive = true) {
      let query = supabase
        .from(TABLES.MEDICATION_TYPES_MASTER)
        .select('id, medication_type_name, is_active')
        .order('medication_type_name');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MedicationType[];
    },

    async createMedicationType(name: string) {
      const { data, error } = await supabase
        .from(TABLES.MEDICATION_TYPES_MASTER)
        .insert({ medication_type_name: name, is_active: true })
        .select('id, medication_type_name, is_active')
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('You do not have permission to perform this action');
      return data as MedicationType;
    },

    async updateMedicationType(
      id: string,
      updates: { name?: string; is_active?: boolean },
    ) {
      const dbUpdates: any = {};
      if (updates.name !== undefined)
        dbUpdates.medication_type_name = updates.name;
      if (updates.is_active !== undefined)
        dbUpdates.is_active = updates.is_active;

      const { data, error } = await supabase
        .from(TABLES.MEDICATION_TYPES_MASTER)
        .update(dbUpdates)
        .eq('id', id)
        .select('id, medication_type_name, is_active')
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('You do not have permission to perform this action');
      return data as MedicationType;
    },

    async deleteMedicationType(id: string) {
      const { error } = await supabase
        .from(TABLES.MEDICATION_TYPES_MASTER)
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error(
            'Cannot delete this type because it is currently assigned to one or more medications.',
          );
        }
        throw error;
      }
    },

    async create(
      medication: Omit<
        MedicationMaster,
        'id' | 'created_at' | 'updated_at' | 'medication_type'
      >,
    ) {
      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .insert(medication)
        .select(MEDICATION_VIEWS.STANDARD)
        .maybeSingle();

      if (error) {
        if (
          error.code === '23505' &&
          error.message.includes('medications_master_medication_name_key')
        ) {
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
      // Remove joined data before update if present
      const { medication_type, ...cleanUpdates } = updates as any;

      const { data, error } = await supabase
        .from(TABLES.MEDICATIONS_MASTER)
        .update(cleanUpdates)
        .eq('id', id)
        .select(MEDICATION_VIEWS.STANDARD)
        .maybeSingle();

      if (error) {
        if (
          error.code === '23505' &&
          error.message.includes('medications_master_medication_name_key')
        ) {
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
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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

    async create(
      contactType: Omit<ContactTypeMaster, 'id' | 'created_at' | 'updated_at'>,
    ) {
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
        throw new Error(
          'You do not have permission to edit this contact type, or it does not exist.',
        );
      }
      return data as ContactTypeMaster;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.CONTACT_TYPES_MASTER)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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

    async create(
      departmentData: Database['public']['Tables']['ic_departments']['Insert'],
    ) {
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

    async update(
      id: string,
      updates: Database['public']['Tables']['ic_departments']['Update'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .update(updates)
        .eq('id', id)
        .select(MASTER_LIST_VIEWS.DEPARTMENTS)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(
          'You do not have permission to edit this department, or it does not exist.',
        );
      }
      return data as Department;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Employment Types Master
   */
  employmentTypes: {
    async list(includeInactive = true) {
      let query = supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .select(MASTER_LIST_VIEWS.EMPLOYMENT_TYPES)
        .order('employment_type_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('status', 'Active');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EmploymentType[];
    },

    async create(
      employmentTypeData: Database['public']['Tables']['ic_employment_types_master']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .insert([employmentTypeData])
        .select(MASTER_LIST_VIEWS.EMPLOYMENT_TYPES)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(
          `You do not have permission to add this employment type.`,
        );
      }
      return data as EmploymentType;
    },

    async update(
      id: string,
      updates: Database['public']['Tables']['ic_employment_types_master']['Update'],
    ) {
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
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.EMPLOYMENT_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * House Types Master
   */
  houseTypes: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_TYPES_MASTER)
        .select('*')
        .order('house_type_name', { ascending: true });

      if (error) throw error;
      return data;
    },

    async create(
      houseTypeData: Database['public']['Tables']['ic_house_types_master']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_TYPES_MASTER)
        .insert([houseTypeData])
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('You do not have permission to perform this action');
      return data;
    },

    async update(
      id: string,
      updates: Database['public']['Tables']['ic_house_types_master']['Update'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_TYPES_MASTER)
        .update(updates)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('You do not have permission to perform this action');
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.HOUSE_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },
  },

  /**
   * Seizure Types Master
   */
  seizureTypes: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.SEIZURE_TYPES_MASTER)
        .select('id, name, description, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },

    async upsert(
      record: Database['public']['Tables']['ic_seizure_types_master']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.SEIZURE_TYPES_MASTER)
        .upsert([record])
        .select('id, name, description, created_at, updated_at')
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.SEIZURE_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Behaviour Types Master
   */
  behaviourTypes: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.BEHAVIOUR_TYPES_MASTER)
        .select('id, name, description, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },

    async upsert(
      record: Database['public']['Tables']['ic_behaviour_types_master']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.BEHAVIOUR_TYPES_MASTER)
        .upsert([record])
        .select('id, name, description, created_at, updated_at')
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.BEHAVIOUR_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Funding Sources Master
   */
  fundingSources: {
    async list(includeInactive = true) {
      let query = supabase
        .from(TABLES.FUNDING_SOURCES_MASTER)
        .select(MASTER_LIST_VIEWS.FUNDING_SOURCES)
        .order('funding_source_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.FUNDING_SOURCES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Funding Types Master
   */
  fundingTypes: {
    async list(includeInactive = true) {
      let query = supabase
        .from(TABLES.FUNDING_TYPES_MASTER)
        .select(MASTER_LIST_VIEWS.FUNDING_TYPES)
        .order('funding_type_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.FUNDING_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Calendar Event Types Master
   */
  eventTypes: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER)
        .select('id, event_type_name, color, status, created_at, updated_at')
        .order('event_type_name', { ascending: true });

      if (error) throw error;
      return data;
    },

    async upsert(
      record: Database['public']['Tables']['ic_house_calendar_event_types_master']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER)
        .upsert([record])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Leave Types Master
   */
  leaveTypes: {
    async list(includeInactive = true) {
      let query = supabase
        .from(TABLES.LEAVE_TYPES)
        .select('*')
        .order('leave_type_name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async upsert(
      record: Database['public']['Tables']['ic_leave_types']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.LEAVE_TYPES)
        .upsert([record])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.LEAVE_TYPES)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },
  },

  /**
   * Checklist Master
   */
  checklists: {
    async list() {
      const { data, error } = await supabase
        .from(TABLES.CHECKLIST_MASTER)
        .select(
          `
          *,
          items:${TABLES.CHECKLIST_ITEM_MASTER}(*)
        `,
        )
        .order('checklist_name', { ascending: true });

      if (error) throw error;
      return (data || []).map((cl) => ({
        ...cl,
        items: (cl.items || []).sort(
          (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0),
        ),
      }));
    },

    async upsert(payload: any, id?: string) {
      const { items, ...dbPayload } = payload;

      let result;
      if (id) {
        const { data, error } = await supabase
          .from(TABLES.CHECKLIST_MASTER)
          .update(dbPayload)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from(TABLES.CHECKLIST_MASTER)
          .insert([dbPayload])
          .select()
          .maybeSingle();
        if (error) throw error;
        result = data;
      }

      if (result && items) {
        await this.syncItems(result.id, items);
      }

      return result;
    },

    async delete(id: string) {
      // 1. Delete items first
      await supabase
        .from(TABLES.CHECKLIST_ITEM_MASTER)
        .delete()
        .eq('master_id', id);
      // 2. Delete the master
      const { error } = await supabase
        .from(TABLES.CHECKLIST_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async syncItems(masterId: string, items: any[]) {
      const { data: existing } = await supabase
        .from(TABLES.CHECKLIST_ITEM_MASTER)
        .select('id')
        .eq('master_id', masterId);
      const existingIds = (existing || []).map((e) => e.id);
      const currentIds = items
        .filter((i) => i.id && !i.id.toString().startsWith('temp-'))
        .map((i) => i.id);

      const toDelete = existingIds.filter((id) => !currentIds.includes(id));
      if (toDelete.length > 0) {
        await supabase
          .from(TABLES.CHECKLIST_ITEM_MASTER)
          .delete()
          .in('id', toDelete);
      }

      for (const item of items) {
        const itemPayload = {
          master_id: masterId,
          title: item.title,
          instructions: item.instructions || null,
          group_title: item.group_title || 'Morning',
          priority: item.priority || 'medium',
          is_required: !!item.is_required,
          sort_order: item.sort_order || 0,
        };

        if (item.id && !item.id.toString().startsWith('temp-')) {
          await supabase
            .from(TABLES.CHECKLIST_ITEM_MASTER)
            .update(itemPayload)
            .eq('id', item.id);
        } else {
          await supabase
            .from(TABLES.CHECKLIST_ITEM_MASTER)
            .insert([itemPayload]);
        }
      }
    },
  },

  /**
   * Incident Types Master
   */
  incidentTypes: {
    async list(includeInactive = true) {
      let query = supabase
        .from(TABLES.INCIDENT_TYPES_MASTER)
        .select('id, name, description, is_active, created_at, updated_at')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async upsert(
      record: Database['public']['Tables']['ic_incident_types_master']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.INCIDENT_TYPES_MASTER)
        .upsert([record])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.INCIDENT_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Restrictive Practice Types Master
   */
  restrictivePracticeTypes: {
    async list(includeInactive = true) {
      let query = supabase
        .from(TABLES.RESTRICTIVE_PRACTICE_TYPES_MASTER)
        .select('id, name, description, is_active, created_at, updated_at')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async upsert(
      record: Database['public']['Tables']['ic_restrictive_practice_types_master']['Insert'],
    ) {
      const { data, error } = await supabase
        .from(TABLES.RESTRICTIVE_PRACTICE_TYPES_MASTER)
        .upsert([record])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.RESTRICTIVE_PRACTICE_TYPES_MASTER)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /**
   * Clinical Tracker Master Lists (Unified API)
   */
  clinicalTrackers: {
    async list(table: TableName, includeInactive = true) {
      let query = supabase
        .from(table)
        .select('id, name, description, is_active, created_at, updated_at')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async upsert(table: TableName, record: any) {
      const { data, error } = await supabase
        .from(table)
        .upsert([record])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async delete(table: TableName, id: string) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  },
};
