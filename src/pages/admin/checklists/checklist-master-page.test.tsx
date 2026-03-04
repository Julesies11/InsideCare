import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ChecklistMasterPage } from './checklist-master-page';
import { renderWithProviders } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockChecklistMaster = {
  id: 'master-1',
  name: 'Weekly Safety Audit',
  frequency: 'weekly',
  description: 'Standard safety check',
  items: [
    {
      id: 'item-1',
      master_id: 'master-1',
      title: 'Check Fire Extinguishers',
      instructions: 'Ensure they are not expired',
      priority: 'high',
      is_required: true,
      sort_order: 0,
    },
  ],
};

// Mock useIsMobile if needed (it's used in some components but maybe not here directly)
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('ChecklistMasterPage', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/checklist_master`, () => {
        return HttpResponse.json([mockChecklistMaster]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/checklist_master`, () => {
        return HttpResponse.json({ ...mockChecklistMaster, id: 'new-id' });
      })
    );
  });

  it('renders the page and loads checklists', async () => {
    renderWithProviders(<ChecklistMasterPage />);

    expect(screen.getByText('Checklist Templates')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Safety Audit')).toBeInTheDocument();
      expect(screen.getByText('Standard safety check')).toBeInTheDocument();
    });
  });

  it('allows opening the new checklist dialog', async () => {
    const { user } = renderWithProviders(<ChecklistMasterPage />);

    const newBtn = screen.getByRole('button', { name: /new master checklist/i });
    await user.click(newBtn);

    expect(screen.getByText('Add Master Checklist')).toBeInTheDocument();
    expect(screen.getByLabelText(/name \*/i)).toBeInTheDocument();
  });

  it('filters checklists by search term', async () => {
    const { user } = renderWithProviders(<ChecklistMasterPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Safety Audit')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search master checklists/i);
    await user.type(searchInput, 'NothingMatches');

    await waitFor(() => {
      expect(screen.queryByText('Weekly Safety Audit')).not.toBeInTheDocument();
      expect(screen.getByText(/no master checklists found/i)).toBeInTheDocument();
    });
  });
});
