import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { ShiftNoteWordTemplatesPage } from './shift-note-word-templates-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('@/hooks/use-shift-notes', () => ({
  useShiftNotes: () => ({
    shiftNotes: [],
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

describe('ShiftNoteWordTemplatesPage Smoke Test', () => {
  it('renders the shift note word templates page correctly', () => {
    render(
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ShiftNoteWordTemplatesPage />
          </MemoryRouter>
        </QueryClientProvider>
      </SettingsProvider>,
    );

    // Verify page title and selector exist
    expect(screen.getByText('Shift Note Word Reports')).toBeInTheDocument();
    expect(screen.getByText('1. Select Shift Note')).toBeInTheDocument();
  });
});
