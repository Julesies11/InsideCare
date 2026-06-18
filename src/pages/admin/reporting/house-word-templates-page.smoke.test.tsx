import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { HouseWordTemplatesPage } from './house-word-templates-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/hooks/use-houses', () => ({
  useActiveHouses: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-docx-templates', () => ({
  useDocxTemplates: () => ({
    templates: [],
    isLoading: false,
    downloadTemplate: vi.fn(),
    upload: vi.fn(),
    deleteTemplate: vi.fn(),
  }),
}));

describe('HouseWordTemplatesPage Smoke Test', () => {
  it('renders the house word templates page correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <HouseWordTemplatesPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    // Verify page title and selector exist
    expect(screen.getByText('House Word Reports')).toBeInTheDocument();
    expect(screen.getByText('1. Select House')).toBeInTheDocument();
  });
});
