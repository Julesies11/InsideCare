import { render, screen, fireEvent } from '@testing-library/react';
import { ShiftCard, ShiftCardData } from './shift-card';
import { describe, it, expect, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockShift: ShiftCardData = {
  id: 'shift-1',
  start_date: '2026-04-05',
  start_time: '08:00:00',
  end_time: '16:00:00',
  shift_template: 'Morning',
  staff_name: 'John Doe',
  staff_id: 'staff-1',
  house: { id: 'house-1', name: 'Test House' },
  participants: [{ id: 'p-1', name: 'Participant 1' }],
  assigned_checklists: [{ id: 'cl-1', checklist_id: 'check-1', assignment_title: 'Morning Routine', is_completed: false }],
  notesCount: 2
};

describe('ShiftCard', () => {
  const onClick = vi.fn();

  it('renders compact view correctly', () => {
    render(
      <TooltipProvider>
        <ShiftCard 
          shift={mockShift} 
          compact={true} 
          showStaffName={true} 
          onClick={onClick} 
        />
      </TooltipProvider>
    );

    expect(screen.getByText('Morning')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('1 Participant')).toBeDefined();
    expect(screen.getByText('Morning Routine')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined(); // notesCount
  });

  it('renders expanded view correctly', () => {
    render(
      <TooltipProvider>
        <ShiftCard 
          shift={mockShift} 
          compact={false} 
          showStaffName={true} 
          onClick={onClick} 
        />
      </TooltipProvider>
    );

    expect(screen.getByText('Morning')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Test House')).toBeDefined();
    expect(screen.getByText('1 Participant')).toBeDefined();
    expect(screen.getByText('Morning Routine')).toBeDefined();
    expect(screen.getByText('2 Notes')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    render(
      <TooltipProvider>
        <ShiftCard 
          shift={mockShift} 
          compact={true} 
          showStaffName={true} 
          onClick={onClick} 
        />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByText('Morning').closest('div')!);
    expect(onClick).toHaveBeenCalled();
  });

  it('shows OPEN SHIFT for unassigned shifts', () => {
    const unassignedShift = { ...mockShift, staff_id: undefined, staff_name: undefined };
    render(
      <TooltipProvider>
        <ShiftCard 
          shift={unassignedShift} 
          compact={true} 
          showStaffName={true} 
          onClick={onClick} 
        />
      </TooltipProvider>
    );

    expect(screen.getByText('OPEN SHIFT')).toBeDefined();
  });
});
