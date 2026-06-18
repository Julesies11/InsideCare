import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { StaffWordTemplatesPage } from './staff-word-templates-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/hooks/use-staff', () => ({
  useActiveStaff: () => ({
    staff: [],
    count: 0,
    loading: false,
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

describe('StaffWordTemplatesPage Smoke Test', () => {
  it('renders the staff word templates page correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <StaffWordTemplatesPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    // Verify page title and selector exist
    expect(screen.getByText('Staff Word Reports')).toBeInTheDocument();
    expect(screen.getByText('1. Select Staff Member')).toBeInTheDocument();
  });
});
