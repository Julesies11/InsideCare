import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { WordTemplatesReportPage } from './word-templates-report-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
vi.mock('@/hooks/use-participants', () => ({
  useActiveParticipants: () => ({
    participants: [],
    count: 0,
    loading: false,
    error: null,
  }),
  useParticipant: () => ({ participant: null, loading: false, error: null }),
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

describe('WordTemplatesReportPage Smoke Test', () => {
  it('renders the participant word templates page correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <WordTemplatesReportPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    // Verify key titles and selectors exist
    expect(screen.getByText('Participant Word Reports')).toBeInTheDocument();
    expect(screen.getByText('1. Select Participant')).toBeInTheDocument();
  });
});
