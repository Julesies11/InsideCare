import { ReactElement, ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { useHouseCalendarEventTypesMaster } from './use-house-calendar-event-types-master';

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

describe('useHouseCalendarEventTypesMaster', () => {
  it('should fetch calendar event types successfully', async () => {
    server.use(
      http.get(
        `${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_CALENDAR_EVENT_TYPES_MASTER}`,
        () => {
          return HttpResponse.json([
            {
              id: 'cet-1',
              event_type_name: 'Meeting',
              color: 'purple',
              status: 'Active',
            },
            {
              id: 'cet-2',
              event_type_name: 'Appointment',
              color: 'orange',
              status: 'Active',
            },
          ]);
        },
      ),
    );

    const { result } = renderHook(() => useHouseCalendarEventTypesMaster(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].event_type_name).toBe('Meeting');
    expect(result.current.data?.[0].color).toBe('purple');
  });
});
