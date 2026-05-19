import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StaffLeaveList } from './staff-leave-list';
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

describe('StaffLeaveList Smoke Test', () => {
  it('renders the employee leave list without crashing', async () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <StaffLeaveList />
          </QueryClientProvider>
        </SettingsProvider>
      </MemoryRouter>
    );

    // Check for page title/header
    expect(screen.getAllByText(/Leave Requests/i).length).toBeGreaterThan(0);
  });
});
