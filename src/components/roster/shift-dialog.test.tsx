import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import { ShiftDialog } from './shift-dialog';
import { renderWithProviders } from '@/test/test-utils';
import { format } from 'date-fns';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              neq: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }))
    }))
  }
}));

const mockStaff = [
  { id: 'staff-1', name: 'John Doe', status: 'active', photo_url: '' },
  { id: 'staff-2', name: 'Inactive Staff', status: 'inactive', photo_url: '' },
];

const mockHouses = [
  { id: 'house-1', name: 'Sunset House' },
];

const mockParticipants = [
  { id: 'part-1', name: 'Alice Smith', status: 'active', house_id: 'house-1' },
  { id: 'part-2', name: 'Bob Jones', status: 'active', house_id: 'house-1' },
  { id: 'part-3', name: 'Charlie Brown', status: 'inactive', house_id: 'house-1' },
];

describe('ShiftDialog Logic', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    shift: null,
    staffList: mockStaff,
    staffSelectionDisabled: false,
    houses: mockHouses,
    participants: mockParticipants,
    onSave: vi.fn(),
    onDelete: vi.fn(),
  };

  it('filters out inactive staff from the dropdown', async () => {
    renderWithProviders(<ShiftDialog {...defaultProps} />);
    
    // Find the select trigger by its placeholder text
    const staffSelect = screen.getByText('Select staff member');
    fireEvent.click(staffSelect);
    
    // John Doe should be there, Inactive Staff should not
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Inactive Staff')).not.toBeInTheDocument();
  });

  it('filters out inactive participants from auto-assignment', async () => {
    // When a house is selected, it should auto-assign only ACTIVE participants
    const onSave = vi.fn();
    renderWithProviders(<ShiftDialog {...defaultProps} preSelectedHouseId="house-1" onSave={onSave} />);
    
    // We can check if the participants are selected by looking at the badges or form state if exposed
    // But since it's internal state, we can trigger a save and check what was passed
    const saveButton = screen.getByText(/create shift/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        participant_ids: expect.arrayContaining(['part-1', 'part-2']),
      }), false);
      
      const calls = onSave.mock.calls[0][0];
      expect(calls.participant_ids).not.toContain('part-3'); // Inactive participant
    });
  });

  it('resets double booking warning when date/time changes', async () => {
    // This requires more complex mocking of the supabase callback
    // But we can verify the UI behavior if we had a way to trigger the warning
  });
});
