import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HousesProfilesPage } from './houses-basic-page';
import { renderWithProviders } from '@/test/test-utils';

describe('HousesProfilesPage Smoke Test', () => {
  it('renders the house profiles page without crashing', async () => {
    renderWithProviders(<HousesProfilesPage />);

    // Check for page header
    expect(screen.getByText(/House Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage house information and settings/i)).toBeInTheDocument();

    // Check for "Add House" button
    expect(screen.getByRole('button', { name: /add house/i })).toBeInTheDocument();

    // Check for motivational banner
    expect(screen.getByText(/Creating Safe and Comfortable Homes/i)).toBeInTheDocument();

    // Wait for the table to load (check for mock data from MSW)
    await waitFor(() => {
      expect(screen.getByText(/Test House 1/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
