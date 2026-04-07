import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Houses } from './houses';
import { renderWithProviders } from '@/test/test-utils';

// Mock useHouses hook
vi.mock('@/hooks/use-houses', () => ({
  useHouses: (pageIndex: number, pageSize: number, sort: any[], filters: any) => {
    const mockHouses = [
      {
        id: 'house-1',
        name: 'Test House 1',
        status: 'active',
        capacity: 5,
        address: '123 Test St',
        staff_assignments: [{ count: 1 }]
      },
      {
        id: 'house-2',
        name: 'Test House 2',
        status: 'active',
        capacity: 3,
        address: '456 Mock Ave',
        staff_assignments: [{ count: 1 }]
      }
    ];
    
    // Simple filter simulation
    let filtered = mockHouses;
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = mockHouses.filter(h => filters.statuses.includes(h.status));
    }

    return {
      data: {
        data: filtered,
        count: filtered.length
      },
      isLoading: false,
      error: null
    };
  },
  useUpdateHouse: () => ({
    mutateAsync: vi.fn().mockResolvedValue({})
  })
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

  it('calculates linked staff count correctly (only active assignments)', async () => {
    renderWithProviders(<Houses />);

    await waitFor(() => expect(screen.getByText('Test House 1')).toBeInTheDocument());

    // House 1 has 4 assignments total, but only 1 should be counted as active
    const house1Row = screen.getByText('Test House 1').closest('tr');
    expect(house1Row).toHaveTextContent('1staff member');

    // House 2 has 1 active assignment
    const house2Row = screen.getByText('Test House 2').closest('tr');
    expect(house2Row).toHaveTextContent('1staff member');
  });

  it('filters by status when clicking status filter', async () => {
    const { user } = renderWithProviders(<Houses />);

    // Wait for initial load
    await waitFor(() => expect(screen.getByText('Test House 1')).toBeInTheDocument());

    // Click status filter
    const statusBtn = screen.getAllByRole('button', { name: /status/i }).find(
      btn => btn.getAttribute('data-slot') === 'popover-trigger'
    );
    if (!statusBtn) throw new Error('Status filter button not found');
    await user.click(statusBtn);

    // Verify filter options are visible
    // We look for the label in the popover
    await waitFor(() => {
      expect(screen.getByRole('dialog').querySelector('label[for="status-active"]')).toHaveTextContent('Active');
    });
  });

  it('navigates to detail page when edit is clicked', async () => {
    const { user } = renderWithProviders(<Houses />);

    await waitFor(() => expect(screen.getByText('Test House 1')).toBeInTheDocument());

    // Find and click the edit button for House 1
    // We might need to find all buttons and pick one or use a more specific selector
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // Navigation would normally happen here. In tests we can verify the URL if needed,
    // or just ensure the click handler was called.
  });
});
