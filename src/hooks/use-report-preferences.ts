import { systemApi } from '@/api/system.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/query-keys';

export function useReportPreferences(staffId?: string, reportType?: string) {
  const query = useQuery({
    queryKey: [QUERY_KEYS.REPORT_PREFERENCES, staffId, reportType],
    queryFn: async () => {
      if (!staffId || !reportType) return null;
      return await systemApi.reportPreferences.get(staffId, reportType);
    },
    enabled: !!staffId && !!reportType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    preferences: query.data,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh: query.refetch,
  };
}

export function useSaveReportPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      reportType,
      criteria,
    }: {
      staffId: string;
      reportType: string;
      criteria: any;
    }) => {
      return await systemApi.reportPreferences.save(
        staffId,
        reportType,
        criteria,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEYS.REPORT_PREFERENCES,
          variables.staffId,
          variables.reportType,
        ],
      });
    },
  });
}
