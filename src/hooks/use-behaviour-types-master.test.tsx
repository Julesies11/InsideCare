import { ReactElement, ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { useBehaviourTypesMaster } from './use-behaviour-types-master';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://jxxpufmygwbfzzpioryu.supabase.co';

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

describe('useBehaviourTypesMaster', () => {
  it('should fetch behaviour types successfully', async () => {
    server.use(
      http.get(
        `${SUPABASE_URL}/rest/v1/${TABLES.BEHAVIOUR_TYPES_MASTER}`,
        () => {
          return HttpResponse.json([
            {
              id: 'type-1',
              name: 'Agitation',
              description: 'Restless',
              is_active: true,
            },
            {
              id: 'type-2',
              name: 'Verbal Aggression',
              description: 'Shouting',
              is_active: true,
            },
          ]);
        },
      ),
    );

    const { result } = renderHook(() => useBehaviourTypesMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('Agitation');
  });
});
