import { ReactElement, ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { useEmploymentTypesMaster } from './use-employment-types-master';

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

describe('useEmploymentTypesMaster', () => {
  it('should fetch employment types successfully', async () => {
    server.use(
      http.get(
        `${SUPABASE_URL}/rest/v1/${TABLES.EMPLOYMENT_TYPES_MASTER}`,
        () => {
          return HttpResponse.json([
            { id: 'et-1', name: 'Full-time', status: 'Active' },
            { id: 'et-2', name: 'Casual', status: 'Active' },
          ]);
        },
      ),
    );

    const { result } = renderHook(() => useEmploymentTypesMaster(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Full-time');
  });
});
