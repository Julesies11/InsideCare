import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContactTypesMaster } from './use-contact-types-master';
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

describe('useContactTypesMaster', () => {
  it('should fetch contact types successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/contact_types_master`, () => {
        return HttpResponse.json([
          { id: 'ct-1', name: 'Family', is_active: true },
          { id: 'ct-2', name: 'Doctor', is_active: true },
        ]);
      })
    );

    const { result } = renderHook(() => useContactTypesMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Family');
  });
});
