import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import RosterBoard from './index';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockStaff = [
  { id: 'staff-1', name: 'John Doe', status: 'active' },
];

const mockHouses = [
  { id: 'house-1', name: 'Sunset House', status: 'active' },
];

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
    isLoading: false
  })
}));

describe('RosterBoard', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/staff`, () => {
        return HttpResponse.json(mockStaff);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
        return HttpResponse.json(mockHouses);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/participants`, () => {
        return HttpResponse.json(mockParticipants);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/staff_shifts`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/leave_requests`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/shift_notes`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/house_checklists`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/shift_template_default_checklists`, () => {
        return HttpResponse.json([]);
      })
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
    expect(screen.queryByRole('switch', { name: /group by house/i })).not.toBeInTheDocument();
  });
});
