import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useParticipantMedications } from './use-participant-medications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, ReactElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

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

describe('useParticipantMedications', () => {
  it('should fetch participant medications successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/participant_medications`, () => {
        return HttpResponse.json([
          {
            id: 'med-1',
            participant_id: 'participant-1',
            medication_id: 'master-med-1',
            dosage: '10mg',
            frequency: 'Daily',
            is_active: true,
            medication: {
              id: 'master-med-1',
              name: 'Paracetamol',
              category: 'Pain Relief'
            }
          },
        ]);
      })
    );

    const { result } = renderHook(() => useParticipantMedications('participant-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].medication?.name).toBe('Paracetamol');
  });
});
