import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RolesPage } from './roles-page';
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

describe('RolesPage Smoke Test', () => {
  it('renders the roles page without crashing', async () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <RolesPage />
          </QueryClientProvider>
        </SettingsProvider>
      </MemoryRouter>
    );

    // Check for page title
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();

    // Check for the Add Role button
    expect(screen.getByRole('button', { name: /Add Role/i })).toBeInTheDocument();
  }, 30000);
});
