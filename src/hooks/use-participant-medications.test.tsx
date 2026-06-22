import { ReactElement, ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { useParticipantMedications } from './use-participant-medications';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const createTestQueryClient = () =>
  new QueryClient({
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

describe('useParticipantMedications', () => {
  it('should fetch participant medications successfully', async () => {
    server.use(
      http.get(
        `${SUPABASE_URL}/rest/v1/${TABLES.PARTICIPANT_MEDICATIONS}`,
        () => {
          return HttpResponse.json([
            {
              id: 'med-1',
              participant_id: 'participant-1',
              medication_id: 'master-med-1',
              dosage: '10mg',
              is_active: true,
              is_prn: false,
              medication_info: {
                id: 'master-med-1',
                medication_name: 'Paracetamol',
                category: 'Pain Relief',
              },
            },
          ]);
        },
      ),
    );

    const { result } = renderHook(
      () => useParticipantMedications('participant-1'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].medication?.medication_name).toBe(
      'Paracetamol',
    );
  });
});
