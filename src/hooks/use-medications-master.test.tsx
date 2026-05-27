import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMedicationsMaster } from './use-medications-master';
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

describe('useMedicationsMaster', () => {
  it('should fetch medications successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.MEDICATIONS_MASTER}`, () => {
        return HttpResponse.json([
          { id: 'med-1', medication_name: 'Paracetamol', category: 'Pain Relief', is_active: true },
          { id: 'med-2', medication_name: 'Ibuprofen', category: 'Pain Relief', is_active: true },
        ]);
      })
    );

    const { result } = renderHook(() => useMedicationsMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0].medication_name).toBe('Paracetamol');
  });
});
