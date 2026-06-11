import { Database } from '@/models/database.types';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';

export type OnboardingItemMaster =
  Database['public']['Tables']['ic_onboarding_items_master']['Row'];
export type StaffOnboardingRecord =
  Database['public']['Tables']['ic_staff_onboarding']['Row'];

export interface OnboardingMonitoringItem {
  staff_id: string;
  staff_name: string;
  photo_url: string | null;
  onboarding_item_id: string;
  item_name: string;
  is_complete: boolean;
  comments: string | null;
  assigned_houses: string[];
}

export const onboardingApi = {
  master: {
    async list(includeInactive = false) {
      let query = supabase
        .from(TABLES.ONBOARDING_ITEMS_MASTER)
        .select('*')
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async upsert(
      records:
        | Database['public']['Tables']['ic_onboarding_items_master']['Insert']
        | Database['public']['Tables']['ic_onboarding_items_master']['Insert'][],
    ) {
      const payload = Array.isArray(records) ? records : [records];
      const { data, error } = await supabase
        .from(TABLES.ONBOARDING_ITEMS_MASTER)
        .upsert(payload)
        .select();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.ONBOARDING_ITEMS_MASTER)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
  },

  staff: {
    async list(staffId: string) {
      const { data, error } = await supabase
        .from(TABLES.STAFF_ONBOARDING)
        .select('*')
        .eq('staff_id', staffId);

      if (error) throw error;
      return data || [];
    },

    async sync(staffId: string, records: any[]) {
      if (records.length === 0) return [];

      const { data, error } = await supabase
        .from(TABLES.STAFF_ONBOARDING)
        .upsert(records)
        .select();

      if (error) throw error;
      return data;
    },

    async bulkDelete(ids: string[]) {
      if (ids.length === 0) return true;
      const { error } = await supabase
        .from(TABLES.STAFF_ONBOARDING)
        .delete()
        .in('id', ids);

      if (error) throw error;
      return true;
    },
  },

  monitoring: {
    async getPaginatedList(params: {
      page: number;
      pageSize: number;
      searchTerm?: string;
      statusFilter?: string[];
      staffStatuses?: string[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) {
      const {
        searchTerm,
        statusFilter = [],
        staffStatuses = ['active'],
        sortBy = 'staff_name',
        sortOrder = 'asc',
      } = params;

      // 1. Fetch active staff
      let staffQuery = supabase.from(TABLES.STAFF).select(`
          id,
          staff_name,
          photo_url,
          status,
          house_assignments:${TABLES.HOUSE_STAFF_ASSIGNMENTS}!staff_id(
            house_id,
            house:${TABLES.HOUSES}(house_name)
          )
        `);

      if (staffStatuses && staffStatuses.length > 0) {
        staffQuery = staffQuery.in('status', staffStatuses);
      } else {
        staffQuery = staffQuery.eq('status', 'active');
      }

      const { data: staff, error: staffError } = await staffQuery;
      if (staffError) throw staffError;

      // 2. Fetch active onboarding items
      const { data: masterItems, error: itemsError } = await supabase
        .from(TABLES.ONBOARDING_ITEMS_MASTER)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      // 3. Batch fetch all records
      const staffIds = staff.map((s) => s.id);
      const { data: allRecords, error: recordsError } = await supabase
        .from(TABLES.STAFF_ONBOARDING)
        .select('*')
        .in('staff_id', staffIds);

      if (recordsError) throw recordsError;

      // 4. Reconciliation
      let allRequirements: OnboardingMonitoringItem[] = [];
      const recordMap = new Map();
      allRecords?.forEach((r) => {
        const key = `${r.staff_id}_${r.onboarding_item_id}`;
        recordMap.set(key, r);
      });

      staff.forEach((s) => {
        const houseNames =
          s.house_assignments
            ?.map((ha: any) => ha.house?.house_name)
            .filter(Boolean) || [];

        masterItems?.forEach((item) => {
          const record = recordMap.get(`${s.id}_${item.id}`);
          const isComplete = record?.is_complete || false;
          const status = isComplete ? 'Complete' : 'Pending';

          // Filter by status if requested
          if (statusFilter.length > 0 && !statusFilter.includes(status)) return;

          // Filter by search term if requested
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesStaff = s.staff_name.toLowerCase().includes(searchLower);
            const matchesTask = item.item_name.toLowerCase().includes(searchLower);
            if (!matchesStaff && !matchesTask) return;
          }

          allRequirements.push({
            staff_id: s.id,
            staff_name: s.staff_name,
            photo_url: s.photo_url,
            onboarding_item_id: item.id,
            item_name: item.item_name,
            is_complete: isComplete,
            comments: record?.comments || null,
            assigned_houses: houseNames,
          });
        });
      });

      // 5. Sorting
      allRequirements.sort((a, b) => {
        const aVal = (a as any)[sortBy] || '';
        const bVal = (b as any)[sortBy] || '';
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const totalCount = allRequirements.length;

      // 6. Pagination
      if (params.pageSize !== -1) {
        const start = (params.page - 1) * params.pageSize;
        allRequirements = allRequirements.slice(start, start + params.pageSize);
      }

      return {
        data: allRequirements,
        totalCount,
      };
    },
  },

  reporting: {
    async getAuditReport() {
      return onboardingApi.monitoring.getPaginatedList({
        page: 1,
        pageSize: -1,
        staffStatuses: ['active'],
      });
    },
  },
};
