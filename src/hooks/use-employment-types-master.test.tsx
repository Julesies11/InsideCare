import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEmploymentTypesMaster } from './use-employment-types-master';
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

describe('useEmploymentTypesMaster', () => {
  it('should fetch employment types successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/employment_types_master`, () => {
        return HttpResponse.json([
          { id: 'et-1', name: 'Full-time', status: 'Active' },
          { id: 'et-2', name: 'Casual', status: 'Active' },
        ]);
      })
    );

    const { result } = renderHook(() => useEmploymentTypesMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Full-time');
  });
});
