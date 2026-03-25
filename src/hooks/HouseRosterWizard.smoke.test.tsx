import { describe, it, expect, vi } from 'vitest';
import { screen, render, fireEvent } from '@testing-library/react';
import { HouseRosterWizard } from '@/pages/houses/detail/components/HouseRosterWizard';
import { renderWithProviders } from '@/test/test-utils';
import { emptyHousePendingChanges } from '@/models/house-pending-changes';

// Mock the hooks to return stable data and prevent network requests
vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: [
      { id: 'st-1', name: 'Morning', color_theme: 'morning', default_start_time: '07:00', default_end_time: '15:00' }
    ],
    createShiftType: { mutateAsync: vi.fn() },
    updateShiftType: { mutateAsync: vi.fn() },
    deleteShiftType: { mutate: vi.fn() },
    isLoading: false
  })
}));

vi.mock('@/hooks/use-house-checklists', () => ({
  useHouseChecklists: () => ({
    houseChecklists: [
      { id: 'cl-1', name: 'Standard Routine', description: 'Test desc' }
    ],
    isLoading: false
  })
}));

vi.mock('@/hooks/use-shift-assigned-checklists', () => ({
  useShiftAssignedChecklists: () => ({
    assignments: [],
    syncAssignments: { mutate: vi.fn(), isPending: false },
    isLoading: false
  })
}));

describe('HouseRosterWizard Smoke Test', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    houseId: 'house-123',
    houseName: 'Test House',
    pendingChanges: emptyHousePendingChanges,
    onPendingChangesChange: vi.fn(),
  };

  it('renders without crashing at Step 1', () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    expect(screen.getByText(/Step 1: Define Your Shift Model/i)).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
  });

  it('renders without crashing at Step 3 (Shift Templates)', () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn); // to Step 2
    fireEvent.click(continueBtn); // to Step 3
    expect(screen.getByText(/Step 3: Shift Templates/i)).toBeInTheDocument();
  });

  it('renders without crashing at Step 4 (Review)', () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn); // to Step 2
    fireEvent.click(continueBtn); // to Step 3
    fireEvent.click(continueBtn); // to Step 4
    
    expect(screen.getByText(/Ready to Go!/i)).toBeInTheDocument();
    expect(screen.getByText(/Shift Templates defined/i)).toBeInTheDocument();
  });
});
