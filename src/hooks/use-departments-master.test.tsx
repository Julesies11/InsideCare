import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDepartmentsMaster } from './use-departments-master';
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

describe('useDepartmentsMaster', () => {
  it('should fetch departments successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/departments`, () => {
        return HttpResponse.json([
          { id: 'dept-1', name: 'Care', status: 'Active' },
          { id: 'dept-2', name: 'Admin', status: 'Active' },
        ]);
      })
    );

    const { result } = renderHook(() => useDepartmentsMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Care');
  });
});
