import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { HouseDetailSidebar } from './house-detail-sidebar';

describe('HouseDetailSidebar', () => {
  it('renders all required navigation items', () => {
    renderWithProviders(<HouseDetailSidebar />);

    // Top level items
    expect(screen.getByText('House Details')).toBeDefined();
    expect(screen.getByText('House Management')).toBeDefined();
    expect(screen.getByText('Calendar')).toBeDefined();
    expect(screen.getByText('Shift Templates')).toBeDefined();
    expect(screen.getByText('Checklist/Comms')).toBeDefined();
    expect(screen.getByText('Resources')).toBeDefined();
    expect(screen.getByText('Staff')).toBeDefined();
    expect(screen.getByText('Activity Log')).toBeDefined();

    // House Management sub-items
    expect(screen.getByText('Participants')).toBeDefined();
    expect(screen.getByText('Breakdown of Individuals')).toBeDefined();
    expect(screen.getByText('Dynamics within Participants')).toBeDefined();
    expect(screen.getByText('Observations')).toBeDefined();
    expect(screen.getByText('General House Details')).toBeDefined();

    // Checklist/Comms sub-items
    expect(screen.getByText('Daily Comms')).toBeDefined();
    expect(screen.getByText('Checklist Setup')).toBeDefined();
    expect(screen.getByText('Checklist History')).toBeDefined();
  });
});
