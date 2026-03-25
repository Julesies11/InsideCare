import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { ShiftDialog } from './shift-dialog';
import { describe, it, expect, vi } from 'vitest';

describe('ShiftDialog Logic', () => {
  const mockProps: any = {
    open: true,
    onOpenChange: vi.fn(),
    shift: null,
    staffList: [
      { id: 's1', name: 'Active Staff', status: 'active' },
      { id: 's2', name: 'Inactive Staff', status: 'inactive' }
    ],
    staffSelectionDisabled: false,
    houses: [{ id: 'h1', name: 'House 1' }],
    participants: [
      { id: 'p1', name: 'Active Part', status: 'active', house_id: 'h1' },
      { id: 'p2', name: 'Inactive Part', status: 'inactive', house_id: 'h1' }
    ],
    checklists: [],
    shiftTypes: [],
    onSave: vi.fn(),
    onDelete: vi.fn()
  };

  it('filters out inactive participants from auto-assignment', async () => {
    renderWithProviders(<ShiftDialog {...mockProps} preSelectedHouseId="h1" />);
    
    // Should see participants section badge with "1 Selected" (only p1)
    const badge = await screen.findByText('1 Selected');
    expect(badge).toBeInTheDocument();
  });

  it('allows saving a shift with no staff member selected (Open Shift)', async () => {
    const onSave = vi.fn().mockResolvedValue({ id: 'new-id' });
    renderWithProviders(<ShiftDialog {...mockProps} onSave={onSave} />);
    
    const saveButton = screen.getByRole('button', { name: /Create Shift/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
