import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShiftCalendar, ShiftCalendarProps } from './shift-calendar';
import { describe, it, expect, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockShifts: any[] = [
  {
    id: 's1',
    staff_id: 'staff-1',
    staff_name: 'John Doe',
    start_date: '2026-04-15',
    start_time: '08:00:00',
    end_time: '12:00:00',
    shift_template: 'Morning',
    house: { id: 'h1', name: 'House Alpha' }
  },
  {
    id: 's2',
    staff_id: 'staff-1',
    staff_name: 'John Doe',
    start_date: '2026-04-15',
    start_time: '13:00:00',
    end_time: '17:00:00',
    shift_template: 'Afternoon',
    house: { id: 'h2', name: 'House Beta' }
  }
];

const mockProps: ShiftCalendarProps = {
  staffId: 'all',
  viewMode: 'week',
  currentDate: new Date('2026-04-15'),
  shifts: mockShifts,
  loading: false,
  canEdit: true,
  onAddShift: vi.fn(),
  onEditShift: vi.fn(),
};

describe('ShiftCalendar Warnings', () => {
  it('displays a warning icon when a staff member is double booked', async () => {
    render(
      <TooltipProvider>
        <ShiftCalendar {...mockProps} />
      </TooltipProvider>
    );

    // Should find the "!" exclamation mark
    const warnings = screen.getAllByText('!');
    expect(warnings.length).toBeGreaterThan(0);
  });

  // Note: Testing actual Radix Tooltip content in Vitest/JSDOM can be tricky 
  // as it often requires specific event triggering and sometimes doesn't portal correctly in tests.
  // But we can verify the trigger exists.
});
