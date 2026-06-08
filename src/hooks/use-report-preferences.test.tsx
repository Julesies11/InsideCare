import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReportPreferences, useSaveReportPreferences } from './use-report-preferences';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, ReactElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { TABLES } from '@/config/db-tables';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useReportPreferences & useSaveReportPreferences', () => {
  it('should fetch report preferences successfully', async () => {
    const mockPreferences = {
      staff_id: 'staff-1',
      report_type: 'participant_profile',
      criteria: {
        sections: { personal: true, goals: false },
        participantId: 'part-1'
      }
    };

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.REPORT_PREFERENCES}`, () => {
        return HttpResponse.json([mockPreferences]);
      })
    );

    const { result } = renderHook(() => useReportPreferences('staff-1', 'participant_profile'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.preferences).toEqual(mockPreferences.criteria);
  });

  it('should save report preferences successfully', async () => {
    const savePayload = {
      staffId: 'staff-1',
      reportType: 'participant_profile',
      criteria: {
        sections: { personal: true, goals: false },
        participantId: 'part-1'
      }
    };

    server.use(
      http.post(`${SUPABASE_URL}/rest/v1/${TABLES.REPORT_PREFERENCES}`, () => {
        return HttpResponse.json({
          id: 'pref-id-1',
          staff_id: 'staff-1',
          report_type: 'participant_profile',
          criteria: savePayload.criteria
        });
      })
    );

    const { result } = renderHook(() => useSaveReportPreferences(), { wrapper });

    result.current.mutate(savePayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
