import { ReactNode } from 'react';
import { AuthProvider } from '@/auth/providers/supabase-provider';
import { StaffProfilesPage } from '@/pages/employees/staff-profiles';
import RosterBoard from '@/pages/roster-board';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </MemoryRouter>
);

describe('Smoke Tests - Pages', () => {
  it('Staff Profiles page renders without crashing', async () => {
    render(<StaffProfilesPage />, { wrapper });
    expect(await screen.findByText(/Staff Profiles/i)).toBeDefined();
  });

  it('Roster Board page renders without crashing', async () => {
    render(<RosterBoard />, { wrapper });
    expect(await screen.findByText(/Roster Board/i)).toBeDefined();
  });
});
