import { House } from '@/models/house';
import { renderWithProviders } from '@/test/test-utils';
import { HouseRow } from '@/test/type-helpers';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Houses } from './houses';

// Mock useHouses hook
vi.mock('@/hooks/use-houses', () => ({
  useHouses: (
    pageIndex: number,
    pageSize: number,
    sort: any[],
    filters: any,
  ) => {
    const mockHouses: House[] = [
      {
        id: 'house-1',
        house_name: 'Test House 1',
        status: 'active',
        capacity: 5,
        address: '123 Test St',
        staff_assignments: [
          {
            id: 'a1',
            end_date: null,
            staff: {
              id: 'staff-1',
              staff_name: 'Staff One',
              photo_url: null,
              status: 'active',
            },
          },
        ],
      } as any,
      {
        id: 'house-2',
        house_name: 'Test House 2',
        status: 'active',
        capacity: 3,
        address: '456 Mock Ave',
        staff_assignments: [
          {
            id: 'a2',
            end_date: null,
            staff: {
              id: 'staff-2',
              staff_name: 'Staff Two',
              photo_url: null,
              status: 'active',
            },
          },
        ],
      } as any,
    ];

    // Simple filter simulation
    let filtered = mockHouses;
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = mockHouses.filter((h) => filters.statuses.includes(h.status!));
    }

    return {
      houses: filtered,
      count: filtered.length,
      isLoading: false,
      error: null,
    };
  },
  useUpdateHouse: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
}));

describe('Houses Component', () => {
  it('renders the house list correctly', async () => {
    renderWithProviders(<Houses />);

    // Check for search input
    expect(screen.getByPlaceholderText(/search houses/i)).toBeInTheDocument();

    // Wait for MSW to return mock houses
    await waitFor(() => {
      expect(screen.getByText('Test House 1')).toBeInTheDocument();
      expect(screen.getByText('Test House 2')).toBeInTheDocument();
    });

    // Verify address is displayed
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
  });

  it('renders linked staff correctly', async () => {
    renderWithProviders(<Houses />);

    await waitFor(() =>
      expect(screen.getByText('Test House 1')).toBeInTheDocument(),
    );

    // House 1 has 1 active assignment: Staff One
    const house1Row = screen.getByText('Test House 1').closest('tr');
    expect(house1Row).toHaveTextContent('Staff One');

    // House 2 has 1 active assignment: Staff Two
    const house2Row = screen.getByText('Test House 2').closest('tr');
    expect(house2Row).toHaveTextContent('Staff Two');
  });

  it('filters by status when clicking status filter', async () => {
    const { user } = renderWithProviders(<Houses />);

    // Wait for initial load
    await waitFor(() =>
      expect(screen.getByText('Test House 1')).toBeInTheDocument(),
    );

    // Click status filter
    const statusBtn = screen
      .getAllByRole('button', { name: /status/i })
      .find((btn) => btn.getAttribute('data-slot') === 'popover-trigger');
    if (!statusBtn) throw new Error('Status filter button not found');
    await user.click(statusBtn);

    // Verify filter options are visible
    // We look for the label in the popover
    await waitFor(() => {
      expect(
        screen.getByRole('dialog').querySelector('label[for="status-active"]'),
      ).toHaveTextContent('Active');
    });
  });

  it('navigates to detail page when clicking house name', async () => {
    const { user } = renderWithProviders(<Houses />);

    await waitFor(() =>
      expect(screen.getByText('Test House 1')).toBeInTheDocument(),
    );

    // Click the house name link
    const houseLink = screen.getByRole('link', { name: /Test House 1/i });
    await user.click(houseLink);

    // Navigation would normally happen here. Link component is from react-router.
    expect(houseLink).toHaveAttribute(
      'href',
      expect.stringContaining('house-1'),
    );
  });
});
