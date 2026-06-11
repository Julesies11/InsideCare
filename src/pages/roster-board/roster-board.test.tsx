import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import RosterBoard from './index';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockStaff = [{ id: 'staff-1', name: 'John Doe', status: 'active' }];

const mockHouses = [{ id: 'house-1', name: 'Sunset House', status: 'active' }];

const mockParticipants = [
  { id: 'part-1', name: 'Alice Smith', status: 'active' },
];

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

// Mock the hooks used in child components to avoid ReferenceErrors in tests
vi.mock('@/hooks/use-house-shift-templates', () => ({
  useHouseShiftTemplates: () => ({
    shiftTemplates: [],
    defaults: [],
    isLoading: false,
  }),
}));

describe('RosterBoard', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF}`, () => {
        return HttpResponse.json(mockStaff);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSES}`, () => {
        return HttpResponse.json(mockHouses);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.PARTICIPANTS}`, () => {
        return HttpResponse.json(mockParticipants);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_SHIFTS}`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.LEAVE_REQUESTS}`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.SHIFT_NOTES}`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSE_CHECKLISTS}`, () => {
        return HttpResponse.json([]);
      }),
      http.get(
        `${SUPABASE_URL}/rest/v1/${TABLES.SHIFT_TEMPLATE_DEFAULT_CHECKLISTS}`,
        () => {
          return HttpResponse.json([]);
        },
      ),
    );
  });

  it('renders the roster board and loads data', async () => {
    renderWithProviders(<RosterBoard />);

    expect(screen.getByText('Roster Board')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/manage shift schedules/i)).toBeInTheDocument();
    });
  });

  it('shows the motivational banner', () => {
    renderWithProviders(<RosterBoard />);
    expect(screen.getByText('Orchestrating Quality Care')).toBeInTheDocument();
  });

  it('does not show the Group By House toggle (permanently enabled)', () => {
    renderWithProviders(<RosterBoard />);
    expect(
      screen.queryByRole('switch', { name: /group by house/i }),
    ).not.toBeInTheDocument();
  });
});
