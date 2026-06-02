import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditShiftNoteDialog } from './edit-shift-note-dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/hooks/use-participants', () => ({
  useParticipants: () => ({ 
    participants: [{ id: 'p-1', participant_name: 'John Participant' }],
    loading: false
  })
}));

vi.mock('@/hooks/use-staff', () => ({
  useStaff: () => ({ 
    data: { data: [{ id: 's-1', staff_name: 'Jane Staff' }] },
    loading: false
  })
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({ 
    houses: [{ id: 'h-1', house_name: 'House A', status: 'active' }],
    loading: false
  })
}));

vi.mock('@/hooks/use-staff-shifts', () => ({
  useStaffShifts: () => ({
    shifts: [
      { 
        id: 'shift-1', 
        start_date: '2026-05-30', 
        start_time: '09:00:00', 
        house_id: 'h-1', 
        staff_id: 's-1',
        staff_info: { staff_name: 'Jane Staff' }
      }
    ],
    loading: false
  })
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({
    hasAccess: () => true
  }),
  ACCESS_LEVEL: { CONTEXT_READ_WRITE: 'CONTEXT_READ_WRITE' }
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children, disabled }: any) => (
    <select 
      data-testid="mock-select"
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('EditShiftNoteDialog - Shift Selector Feature', () => {
  it('renders the shift selector and infers data on selection', async () => {
    const onOpenChange = vi.fn();
    const onCreate = vi.fn().mockResolvedValue({ error: null });

    render(
      <EditShiftNoteDialog
        open={true}
        onOpenChange={onOpenChange}
        shiftNote={null}
        onSave={vi.fn()}
        onCreate={onCreate}
        mode="create"
      />,
      { wrapper }
    );

    // Dialog should have "Select Shift *" label
    expect(screen.getByText('Select Shift *')).toBeDefined();

    // The read-only info block should not be visible initially
    expect(screen.queryByText('Date')).toBeNull();

    // Select a shift
    const selects = screen.getAllByTestId('mock-select');
    // The first select is shift_id
    const shiftSelect = selects[0];
    
    fireEvent.change(shiftSelect, { target: { value: 'shift-1' } });

    // Info block should now appear with populated data
    await waitFor(() => {
      expect(screen.getByText('Date')).toBeDefined();
    });
    
    // Check if House and Time are visible
    expect(screen.getByText('House A')).toBeDefined();
    expect(screen.getByText('09:00')).toBeDefined();
  });
});
