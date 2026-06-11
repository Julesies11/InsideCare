import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { ChecklistMasterPage } from './checklist-master-page';

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
      </MemoryRouter>,
    );

    // Check for page title
    expect(screen.getByText('Checklist Master')).toBeInTheDocument();
  });
});
