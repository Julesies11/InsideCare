import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { HouseRosterWizard } from './HouseRosterWizard';
import { renderWithProviders } from '@/test/test-utils';
import { emptyHousePendingChanges } from '@/models/house-pending-changes';

// Mock the hooks to return stable data and prevent network requests
vi.mock('@/hooks/use-house-shift-types', () => ({
  useHouseShiftTypes: () => ({
    shiftTypes: [
      { id: 'st-1', name: 'Morning', color_theme: 'morning', default_start_time: '07:00', default_end_time: '15:00' }
    ],
    isLoading: false,
    refresh: vi.fn()
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

vi.mock('@/hooks/use-houses', () => ({
  useHouses: () => ({
    houses: [],
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

  it('renders without crashing at Step 1 (Shift Model)', () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    expect(screen.getByText(/Step 1: Define Your Shift Model/i)).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
  });

  it('navigates to Step 2 (Calendar Tasks)', () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn);
    
    expect(screen.getByText(/Step 2: Calendar Tasks/i)).toBeInTheDocument();
  });

  it('navigates to Step 3 (Review)', () => {
    renderWithProviders(<HouseRosterWizard {...defaultProps} />);
    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn); // to Step 2
    fireEvent.click(continueBtn); // to Step 3
    
    expect(screen.getByText(/Ready to Go!/i)).toBeInTheDocument();
  });
});
