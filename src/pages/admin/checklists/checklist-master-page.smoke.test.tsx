import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChecklistMasterPage } from './checklist-master-page';
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

describe('ChecklistMasterPage Smoke Test', () => {
  it('renders the checklist master page without crashing', async () => {
    render(
      <MemoryRouter>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <ChecklistMasterPage />
          </QueryClientProvider>
        </SettingsProvider>
      </MemoryRouter>
    );

    // Check for page title
    expect(screen.getByText('Checklist Master')).toBeInTheDocument();
  });
});
