import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMedicationsMaster } from './use-medications-master';
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

describe('useMedicationsMaster', () => {
  it('should fetch medications successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/medications_master`, () => {
        return HttpResponse.json([
          { id: 'med-1', name: 'Paracetamol', category: 'Pain Relief', is_active: true },
          { id: 'med-2', name: 'Ibuprofen', category: 'Pain Relief', is_active: true },
        ]);
      })
    );

    const { result } = renderHook(() => useMedicationsMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Paracetamol');
  });
});
