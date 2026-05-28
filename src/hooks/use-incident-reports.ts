import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';
import { QUERY_KEYS } from '@/config/query-keys';
import { IncidentReport, IncidentReportInsert, IncidentReportUpdate } from '@/models/incident-report';

interface UseIncidentReportsOptions {
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

export function useIncidentReports({
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
}: UseIncidentReportsOptions = {}) {
  return useQuery({
    queryKey: [
      QUERY_KEYS.INCIDENT_REPORTS,
      { participantId, staffId, houseId, status, type, priority, startDate, endDate, search, pageIndex, pageSize, sort },
    ],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.INCIDENT_REPORTS)
        .select(`
          *,
          participant:ic_participants(id, participant_name),
          staff:ic_staff!involved_staff_id(id, staff_name),
          reporter:ic_staff!reported_by(id, staff_name),
          house:ic_houses(id, house_name)
        `, { count: 'exact' });

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
      return { data: data as (IncidentReport & { participant: any, staff: any, reporter: any, house: any })[], count };
    },
  });
}

export function useCreateIncidentReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: IncidentReportInsert) => {
      const { data, error } = await supabase
        .from(TABLES.INCIDENT_REPORTS)
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INCIDENT_REPORTS] });
    },
  });
}

export function useUpdateIncidentReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...report }: IncidentReportUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.INCIDENT_REPORTS)
        .update(report)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INCIDENT_REPORTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INCIDENT_REPORTS, variables.id] });
    },
  });
}
