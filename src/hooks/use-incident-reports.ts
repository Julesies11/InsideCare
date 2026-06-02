import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';
import { IncidentReportInsert, IncidentReportUpdate } from '@/models/incident-report';
import { incidentsApi, IncidentListOptions } from '@/api/incidents.api';

export function useIncidentReports(options: IncidentListOptions = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.INCIDENT_REPORTS, options],
    queryFn: () => incidentsApi.list(options),
  });
}

export function useCreateIncidentReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (report: IncidentReportInsert) => incidentsApi.create(report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INCIDENT_REPORTS] });
    },
  });
}

export function useUpdateIncidentReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...report }: IncidentReportUpdate & { id: string }) => 
      incidentsApi.update(id, report),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INCIDENT_REPORTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INCIDENT_REPORTS, variables.id] });
    },
  });
}

export function useIncidentReport(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.INCIDENT_REPORTS, id],
    queryFn: () => incidentsApi.getById(id!),
    enabled: !!id,
  });
}
