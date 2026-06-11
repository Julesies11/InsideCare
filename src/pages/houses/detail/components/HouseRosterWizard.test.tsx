import { emptyHousePendingChanges } from '@/models/house-pending-changes';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { HouseRosterWizard } from './HouseRosterWizard';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Mock the hooks to return stable data and prevent network requests
vi.mock('@/hooks/use-house-shift-templates', () => ({
  useHouseShiftTemplates: () => ({
    shiftTemplates: [
      {
        id: 'st-1',
        shift_template_name: 'Morning',
        color_theme: 'morning',
        default_start_time: '07:00',
        default_end_time: '15:00',
      },
    ],
    isLoading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: [
      {
        id: 'cl-1',
        house_checklist_name: 'Standard Routine',
        description: 'Test desc',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [],
    isLoading: false,
  }),
  useUpdateHouse: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
  useActiveHouses: () => ({
    data: [],
    isLoading: false,
  }),
}));

describe('HouseRosterWizard Smoke Test', () => {
  beforeEach(() => {
    server.use(
      http.patch(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSES}`, () => {
        return HttpResponse.json({ success: true });
      }),
    );
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    houseId: 'house-123',
    houseName: 'Test House',
    pendingChanges: emptyHousePendingChanges,
    onPendingChangesChange: vi.fn(),
  };
  it('renders without crashing at Step 1 (Shift Templates)', () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    expect(
      screen.getByText(/Step 1: Define Your Shift Templates/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
  });

  it('navigates to Step 2 (Calendar Tasks)', async () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Step 2: Calendar Tasks/i)).toBeInTheDocument();
    });
  });

  it('navigates to Step 3 (Review)', async () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn); // to Step 2

    await waitFor(() => {
      expect(screen.getByText(/Step 2: Calendar Tasks/i)).toBeInTheDocument();
    });

    fireEvent.click(continueBtn); // to Step 3

    await waitFor(() => {
      expect(screen.getByText(/Ready to Go!/i)).toBeInTheDocument();
    });
  });
});
