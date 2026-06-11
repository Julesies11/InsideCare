import { ReactElement, ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { useParticipantDocuments } from './use-participant-documents';

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

describe('useParticipantDocuments', () => {
  it('should fetch participant documents successfully', async () => {
    server.use(
      http.get(
        `${SUPABASE_URL}/rest/v1/${TABLES.PARTICIPANT_DOCUMENTS}`,
        () => {
          return HttpResponse.json([
            {
              id: 'doc-1',
              participant_id: 'participant-1',
              file_name: 'care-plan.pdf',
            },
          ]);
        },
      ),
    );

    const { result } = renderHook(
      () => useParticipantDocuments('participant-1'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].file_name).toBe('care-plan.pdf');
  });
});
