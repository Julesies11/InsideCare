import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { Database } from '@/models/database.types';

export type ComplianceType = Database['public']['Tables']['ic_compliance_types_master']['Row'];

export interface ComplianceMonitoringItem {
  staff_id: string;
  staff_name: string;
  photo_url: string | null;
  compliance_type_id: string;
  compliance_name: string;
  status: 'Complete' | 'In Progress' | 'Not Applicable' | 'Missing' | 'Expired' | 'Expiring Soon';
  expiry_date: string | null;
  document_number: string | null;
  comments: string | null;
  assigned_houses: string[];
  updated_at: string | null;
  updated_by_name: string | null;
}

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
        page = 1, 
        pageSize = 10, 
        searchTerm, 
        statusFilter = [], 
        staffStatuses = ['active'],
        sortBy = 'staff_name', 
        sortOrder = 'asc' 
      } = params;

      // 1. Fetch only active staff IDs and basic info first to minimize data transfer
      let staffQuery = supabase
        .from(TABLES.STAFF)
        .select(`
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

      // 2. Fetch all active compliance types that require tracking
      const { data: masterTypesResult, error: typesError } = await supabase
        .from(TABLES.COMPLIANCE_TYPES_MASTER)
        .select('id, compliance_name, system_category, expiry_date_applicable')
        .eq('is_active', true);

      if (typesError) throw typesError;
      const masterTypes = (masterTypesResult || []).filter(t => t.expiry_date_applicable !== false);

      // 3. Batch fetch ALL compliance records for these staff in a single query
      const staffIds = staff.map(s => s.id);
      const { data: allRecords, error: recordsError } = await supabase
        .from(TABLES.STAFF_COMPLIANCE)
        .select(`
          staff_id,
          compliance_type_id,
          expiry_date,
          status,
          document_number,
          comments,
          updated_at,
          updater:${TABLES.STAFF}!updated_by(staff_name)
        `)
        .in('staff_id', staffIds);

      if (recordsError) throw recordsError;

      // 4. Efficient Reconciliation
      const allRequirements: ComplianceMonitoringItem[] = [];
      const today = new Date();
      const parseISO = (s: string) => new Date(s);
      const differenceInDays = (d1: Date, d2: Date) => Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

      const recordMap = new Map();
      allRecords?.forEach(r => {
        const key = `${r.staff_id}_${r.compliance_type_id}`;
        recordMap.set(key, r);
      });

      staff.forEach(s => {
        const houseNames = s.house_assignments?.map((ha: any) => ha.house?.house_name).filter(Boolean) || [];
        
        masterTypes.forEach(type => {
          const typeId = type.id;
          const record = recordMap.get(`${s.id}_${typeId}`);
          
          let status: ComplianceMonitoringItem['status'] = 'Missing';
          if (record) {
            const dbStatus = (record.status || '').toLowerCase().replace(/_/g, ' ');
            if (dbStatus === 'not applicable') return; 
            
            if (dbStatus === 'in progress') {
              status = 'In Progress';
            } else if (dbStatus === 'complete') {
              if (!record.expiry_date) {
                status = 'Complete';
              } else {
                const expiry = parseISO(record.expiry_date);
                const days = differenceInDays(expiry, today);
                if (days < 0) status = 'Expired';
                else if (days <= 30) status = 'Expiring Soon';
                else status = 'Complete';
              }
            } else {
              status = 'In Progress';
            }
          }

          allRequirements.push({
            staff_id: s.id,
            staff_name: s.staff_name,
            photo_url: s.photo_url,
            compliance_type_id: type.id,
            compliance_name: type.compliance_name,
            status,
            expiry_date: record?.expiry_date || null,
            document_number: record?.document_number || null,
            comments: record?.comments || null,
            assigned_houses: houseNames,
            updated_at: record?.updated_at || null,
            updated_by_name: record?.updater?.staff_name || null
          });
        });
      });

      // 5. Filtering
      let filtered = allRequirements;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
          (item.staff_name?.toLowerCase() || '').includes(term) || 
          (item.compliance_name?.toLowerCase() || '').includes(term)
        );
      }

      if (statusFilter && statusFilter.length > 0 && !statusFilter.includes('all')) {
        const lowerStatuses = statusFilter.map(s => s.toLowerCase());
        filtered = filtered.filter(item => lowerStatuses.includes(item.status?.toLowerCase() || ''));
      }

      // 6. Sorting
      filtered.sort((a: any, b: any) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        
        if (valA === valB) return 0;
        if (valA === null) return 1;
        if (valB === null) return -1;
        
        const result = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? result : -result;
      });

      // 7. Pagination
      const totalCount = filtered.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pagedData = filtered.slice(start, end);

      return {
        data: pagedData,
        totalCount
      };
    }
  },

  idDocumentTypes: {
    async list(includeInactive = false) {
      let query = supabase
        .from(TABLES.ID_DOCUMENT_TYPES)
        .select('*')
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async upsert(records: Partial<Database['public']['Tables']['ic_id_document_types']['Insert']> | Partial<Database['public']['Tables']['ic_id_document_types']['Insert']>[]) {
      const payload = Array.isArray(records) ? records : [records];
      const { data, error } = await supabase
        .from(TABLES.ID_DOCUMENT_TYPES)
        .upsert(payload as any)
        .select();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from(TABLES.ID_DOCUMENT_TYPES)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  }
};
