import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { INCIDENT_VIEWS } from '@/config/query-views';
import { IncidentReport, IncidentReportInsert, IncidentReportUpdate } from '@/models/incident-report';

export interface IncidentListOptions {
  participantId?: string;
  staffId?: string;
  houseId?: string;
  status?: string | string[];
  type?: string | string[];
  priority?: string | string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
  sort?: { id: string; desc: boolean }[];
}

export const incidentsApi = {
  /**
   * List incident reports with filtering and pagination.
   */
  async list({
    participantId,
    staffId,
    houseId,
    status,
    type,
    priority,
    startDate,
    endDate,
    search,
    pageIndex = 0,
    pageSize = 50,
    sort = [],
  }: IncidentListOptions = {}) {
    let query = supabase
      .from(TABLES.INCIDENT_REPORTS)
      .select(INCIDENT_VIEWS.DETAIL, { count: 'exact' });

    if (participantId) {
      query = query.eq('involved_participant_id', participantId);
    }
    if (staffId) {
      query = query.eq('involved_staff_id', staffId);
    }
    if (houseId) {
      query = query.eq('house_id', houseId);
    }

    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    if (type) {
      if (Array.isArray(type)) {
        query = query.in('incident_type', type);
      } else {
        query = query.eq('incident_type', type);
      }
    }

    if (priority) {
      if (Array.isArray(priority)) {
        query = query.in('priority', priority);
      } else {
        query = query.eq('priority', priority);
      }
    }

    if (startDate) {
      query = query.gte('incident_date', startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('incident_date', end.toISOString());
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,incident_type.ilike.%${search}%`);
    }

    if (sort.length > 0) {
      sort.forEach((s) => {
        query = query.order(s.id, { ascending: !s.desc });
      });
    } else {
      query = query.order('incident_date', { ascending: false });
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return { 
      data: data as (IncidentReport & { participant: any, staff: any, reporter: any, house: any })[], 
      count 
    };
  },

  /**
   * Create a new incident report.
   */
  async create(report: IncidentReportInsert) {
    const { data, error } = await supabase
      .from(TABLES.INCIDENT_REPORTS)
      .insert(report)
      .select(INCIDENT_VIEWS.DETAIL)
      .single();

    if (error) throw error;
    return data as (IncidentReport & { participant: any, staff: any, reporter: any, house: any });
  },

  /**
   * Update an existing incident report.
   */
  async update(id: string, report: IncidentReportUpdate) {
    const { data, error } = await supabase
      .from(TABLES.INCIDENT_REPORTS)
      .update(report)
      .eq('id', id)
      .select(INCIDENT_VIEWS.DETAIL)
      .single();

    if (error) throw error;
    return data as (IncidentReport & { participant: any, staff: any, reporter: any, house: any });
  },

  /**
   * Get a single incident report by ID.
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from(TABLES.INCIDENT_REPORTS)
      .select(INCIDENT_VIEWS.DETAIL)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as (IncidentReport & { participant: any, staff: any, reporter: any, house: any });
  }
};
