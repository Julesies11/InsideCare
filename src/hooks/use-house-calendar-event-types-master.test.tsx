import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHouseCalendarEventTypesMaster } from './use-house-calendar-event-types-master';
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

describe('useHouseCalendarEventTypesMaster', () => {
  it('should fetch calendar event types successfully', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/house_calendar_event_types_master`, () => {
        return HttpResponse.json([
          { id: 'cet-1', name: 'Meeting', color: 'purple', status: 'Active' },
          { id: 'cet-2', name: 'Appointment', color: 'orange', status: 'Active' },
        ]);
      })
    );

    const { result } = renderHook(() => useHouseCalendarEventTypesMaster(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].color).toBe('purple');
  });
});
