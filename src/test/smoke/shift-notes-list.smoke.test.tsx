import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { ShiftNotes } from '@/pages/participants/shift-notes/components/shift-notes';

// Mock the hooks used in the component
vi.mock('@/hooks/use-shift-notes', () => ({
  useShiftNoteTasks: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-staff', () => ({
  useStaff: () => ({
    staff: [],
    isLoading: false,
  }),
}));

describe('ShiftNotes List Smoke Test', () => {
  it('renders the Shift Documentation Tracking component without crashing', () => {
    renderWithProviders(<ShiftNotes />);
    
    // Check for the Search input which is always present
    expect(screen.getByPlaceholderText(/Search shifts.../i)).toBeInTheDocument();
    
    // Verify our new status buttons are present
    expect(screen.getByText(/Note Submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Shift/i)).toBeInTheDocument();
  });
});
