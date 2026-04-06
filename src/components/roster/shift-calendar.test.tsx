import { render, screen, fireEvent } from '@testing-library/react';
import { ShiftCalendar, ShiftCalendarProps } from './shift-calendar';
import { describe, it, expect, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockProps: ShiftCalendarProps = {
  staffId: 'all',
  viewMode: 'week',
  currentDate: new Date('2026-04-15'),
  shifts: [],
  loading: false,
  canEdit: true,
  onAddShift: vi.fn(),
  onEditShift: vi.fn(),
};

describe('ShiftCalendar', () => {
  it('triggers onAddShift when clicking an empty cell in week view', () => {
    render(
      <TooltipProvider>
        <ShiftCalendar {...mockProps} />
      </TooltipProvider>
    );

    // Week of April 15, 2026 (Wednesday).
    // Let's find the empty cell indicator or the date and click it.
    const emptyCell = screen.getAllByText(/No shifts/i)[0];
    fireEvent.click(emptyCell.parentElement!);
    
    expect(mockProps.onAddShift).toHaveBeenCalled();
  });

  it('triggers onAddShift when clicking a date badge in week view', () => {
    render(
      <TooltipProvider>
        <ShiftCalendar {...mockProps} />
      </TooltipProvider>
    );

    // Week of April 15, 2026. Monday is April 13.
    const dateBadge = screen.getByText('13').closest('div');
    fireEvent.click(dateBadge!);
    
    expect(mockProps.onAddShift).toHaveBeenCalled();
  });
});
