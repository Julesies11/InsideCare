import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { ShiftNotes } from './shift-notes';
import { renderWithProviders } from '@/test/test-utils';

const mocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mocks.mockNavigate,
  };
});

vi.mock('@/hooks/use-shift-notes', () => ({
  useShiftNoteTasks: () => ({
    data: [
      {
        id: 'note-1',
        shift_id: 'shift-1',
        start_date: '2026-03-05',
        start_time: '08:00:00',
        end_time: '16:00:00',
        shift_time: '08:00 - 16:00',
        participant_id: 'p-1',
        participant_name: 'John Doe',
        participant_names: 'John Doe',
        staff_id: 's-1',
        staff_name: 'Staff Member',
        house_id: 'h-1',
        house_name: 'House A',
        shift_template: 'Morning',
        note_id: 'note-1',
        note_status: 'done'
      }
    ],
    isLoading: false,
    error: null
  })
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [
      { id: 'h-1', house_name: 'House A', status: 'active' },
      { id: 'h-2', house_name: 'House B', status: 'active' }
    ],
    loading: false
  })
}));

describe('ShiftNotes', () => {
  it('renders correctly and loads data', async () => {
    renderWithProviders(<ShiftNotes />);
    
    await waitFor(() => {
      // Use getAllByText for names that appear in both filter and table
      expect(screen.getAllByText(/John Doe/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/House A/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Staff Member/i)[0]).toBeInTheDocument();
    });
  });

  it('filters by search query', async () => {
    renderWithProviders(<ShiftNotes />);

    await waitFor(() => {
      expect(screen.getAllByText(/John Doe/i)[0]).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search shifts.../i);
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });

    await waitFor(() => {
      expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
    });
    
    fireEvent.change(searchInput, { target: { value: 'John' } });
    await waitFor(() => {
      expect(screen.getAllByText(/John Doe/i)[0]).toBeInTheDocument();
    });
  });

  it('navigates to detail page when clicking shift date', async () => {
    const { user } = renderWithProviders(<ShiftNotes />);

    await waitFor(() => {
      expect(screen.getAllByText(/John Doe/i)[0]).toBeInTheDocument();
    });

    // Find the shift date link
    const shiftLink = screen.getByRole('link', { name: /05 Mar 2026/i });
    await user.click(shiftLink);

    // In this test, we verify the link href since we are not testing the actual navigation
    expect(shiftLink).toHaveAttribute('href', expect.stringContaining('note-1'));
  });

  it('filters by house using popover', async () => {
    const { user } = renderWithProviders(<ShiftNotes />);

    await waitFor(() => {
      expect(screen.getAllByText(/John Doe/i)[0]).toBeInTheDocument();
    });

    // Click House filter button — using popover-trigger slot
    const houseFilterBtn = screen.getAllByRole('button').find(
      btn => btn.textContent?.includes('House') && btn.getAttribute('data-slot') === 'popover-trigger'
    );
    if (!houseFilterBtn) throw new Error('House filter button not found');
    await user.click(houseFilterBtn);

    // Find and click House B checkbox
    const houseBCheckbox = await screen.findByLabelText(/House B/i);
    await user.click(houseBCheckbox);

    await waitFor(() => {
        expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
    });
  });
});
