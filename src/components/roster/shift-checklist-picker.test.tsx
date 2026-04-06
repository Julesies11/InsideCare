import { render, screen, fireEvent } from '@testing-library/react';
import { ShiftChecklistPicker } from './ShiftChecklistPicker';
import { describe, it, expect, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockChecklists = [
  { id: 'cl-1', name: 'Alpha Checklist', sort_order: 1 },
  { id: 'cl-2', name: 'Beta Checklist', sort_order: 2 },
  { id: 'cl-3', name: 'Gamma Checklist', sort_order: 3 },
];

describe('ShiftChecklistPicker', () => {
  it('does not re-sort items when selection changes', () => {
    const onToggle = vi.fn();
    
    // Initially Alpha is selected
    const { rerender } = render(
      <TooltipProvider>
        <ShiftChecklistPicker 
          checklists={mockChecklists} 
          selectedIds={['cl-1']} 
          onToggle={onToggle} 
        />
      </TooltipProvider>
    );

    // Alpha should be first
    let items = screen.getAllByRole('heading', { level: 3 });
    expect(items[0].textContent).toBe('Alpha Checklist');
    expect(items[1].textContent).toBe('Beta Checklist');

    // Toggle Gamma (cl-3)
    fireEvent.click(screen.getByText('Gamma Checklist').closest('.relative')!);
    expect(onToggle).toHaveBeenCalledWith('cl-3', 'Gamma Checklist');

    // Simulate parent state update by rerendering with new selectedIds
    rerender(
      <TooltipProvider>
        <ShiftChecklistPicker 
          checklists={mockChecklists} 
          selectedIds={['cl-1', 'cl-3']} 
          onToggle={onToggle} 
        />
      </TooltipProvider>
    );

    // Order should NOT have changed (Gamma should still be last, not jump to top)
    items = screen.getAllByRole('heading', { level: 3 });
    expect(items[0].textContent).toBe('Alpha Checklist');
    expect(items[1].textContent).toBe('Beta Checklist');
    expect(items[2].textContent).toBe('Gamma Checklist');
  });
});
