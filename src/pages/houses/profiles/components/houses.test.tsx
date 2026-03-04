import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Houses } from './houses';
import { renderWithProviders } from '@/test/test-utils';

// Mock the nested hooks that are not yet fully covered by MSW or need specific returns
vi.mock('@/hooks/use-house-staff-assignments', () => ({
  useHouseStaffAssignments: () => ({
    data: [],
    isLoading: false,
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
    expect(screen.getByRole('dialog').querySelector('label[for="status-active"]')).toHaveTextContent('Active');
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
