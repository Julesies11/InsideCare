import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StaffTimesheetList } from './staff-timesheet-list';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { SettingsProvider } from '@/providers/settings-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('StaffTimesheetList Smoke Test', () => {
  it('renders the employee timesheet list without crashing', async () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <StaffTimesheetList />
          </QueryClientProvider>
        </SettingsProvider>
      </MemoryRouter>
    );

    // Check for page title/header
    expect(screen.getAllByText(/Timesheets/i).length).toBeGreaterThan(0);
    
    // Check for status filter
    expect(screen.getAllByText(/Awaiting Approval/i).length).toBeGreaterThan(0);
  });
});
