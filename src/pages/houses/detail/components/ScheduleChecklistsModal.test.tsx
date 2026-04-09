import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ScheduleChecklistsModal } from './ScheduleChecklistsModal';

// Create a more robust mock for chained calls
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockFrom = vi.fn((table: string) => {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [
          { id: 'cl-1', name: 'Morning Routine', sort_order: 10 },
          { id: 'cl-2', name: 'Night Handover', sort_order: 20 }
        ], error: null }))
      })),
    })),
    insert: mockInsert,
  };
});

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table)
  }
}));

// Mock hooks
vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: vi.fn(() => ({
    houseChecklists: [
      { id: 'cl-1', name: 'Morning Routine', sort_order: 10 },
      { id: 'cl-2', name: 'Night Handover', sort_order: 20 }
    ],
    loading: false
  }))
}));

vi.mock('@/auth/context/auth-context', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { id: 'user-1', staff_id: 'staff-1' }
    }))
  };
});

describe('ScheduleChecklistsModal', () => {
  it('renders checklists correctly and allows selection', async () => {
    renderWithProviders(
      <ScheduleChecklistsModal 
        open={true} 
        onOpenChange={() => {}} 
        houseId="house-1" 
        houseName="Test House" 
      />
    );

    // Wait for checklists to load
    await waitFor(() => {
      expect(screen.getAllByText(/Morning Routine/i)).toBeDefined();
    });

    // Checklist names should be visible
    expect(screen.getAllByText(/Night Handover/i)).toBeDefined();
  });

  it('calls supabase insert on confirm', async () => {
    renderWithProviders(
      <ScheduleChecklistsModal 
        open={true} 
        onOpenChange={() => {}} 
        houseId="house-1" 
        houseName="Test House" 
      />
    );

    await waitFor(() => screen.getAllByText(/Morning Routine/i));

    // Select a checklist on Monday (first checklist in first day column)
    const checklists = screen.getAllByText(/Morning Routine/i);
    fireEvent.click(checklists[0]);

    // Click Confirm & Schedule
    const confirmButton = screen.getByText(/Confirm & Schedule/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
