import { renderWithProviders, screen } from '@/test/test-utils';
import OrgShiftTemplatesPage from './OrgShiftTemplatesPage';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock the hook
vi.mock('@/hooks/use-org-shift-templates', () => ({
  useOrgShiftTemplates: () => ({
    templates: [
      {
        id: '1',
        name: 'Morning',
        short_name: 'M',
        start_time_default: '07:00',
        end_time_default: '15:00',
        icon_name: 'sun',
        color_theme: 'morning',
        sort_order: 10,
        is_active: true,
      }
    ],
    isLoading: false,
    createTemplate: { mutateAsync: vi.fn() },
    updateTemplate: { mutateAsync: vi.fn() },
    deleteTemplate: { mutateAsync: vi.fn() },
  }),
}));

describe('OrgShiftTemplatesPage Smoke Test', () => {
  it('renders the page with templates', () => {
    renderWithProviders(
      <MemoryRouter>
        <OrgShiftTemplatesPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Org Shift Templates')).toBeInTheDocument();
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Add Mode')).toBeInTheDocument();
  });
});
