import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/test-utils';
import { ChecklistMasterRow, Row } from '@/test/type-helpers';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { ChecklistMasterPage } from './checklist-master-page';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockChecklistMaster: Partial<ChecklistMasterRow> & {
  items: Partial<Row<'ic_checklist_item_master'>>[];
} = {
  id: 'master-1',
  checklist_name: 'Weekly Safety Audit',
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
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.CHECKLIST_MASTER}`, () => {
        return HttpResponse.json([mockChecklistMaster]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/${TABLES.CHECKLIST_MASTER}`, () => {
        return HttpResponse.json({ ...mockChecklistMaster, id: 'new-id' });
      }),
    );
  });

  it('renders the page and loads checklists', async () => {
    renderWithProviders(<ChecklistMasterPage />);

    expect(screen.getByText('Checklist Master')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Weekly Safety Audit')).toBeInTheDocument();
      expect(screen.getByText('Standard safety check')).toBeInTheDocument();
    });
  });

  it('allows opening the new checklist dialog', async () => {
    const { user } = renderWithProviders(<ChecklistMasterPage />);

    const newBtn = screen.getByRole('button', { name: /create template/i });
    await user.click(newBtn);

    expect(screen.getByText('New Master Template')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e\.g\. morning clinical routine/i),
    ).toBeInTheDocument();
  });

  it('allows opening the edit checklist dialog', async () => {
    const { user } = renderWithProviders(<ChecklistMasterPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Safety Audit')).toBeInTheDocument();
    });

    // Find the edit button inside the card
    const editBtn = screen.getByRole('button', { name: /edit/i });
    await user.click(editBtn);

    expect(screen.getByText('Edit Master Template')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Weekly Safety Audit')).toBeInTheDocument();
  });

  it('filters checklists by search term', async () => {
    const { user } = renderWithProviders(<ChecklistMasterPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Safety Audit')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search templates\.\.\./i);
    await user.type(searchInput, 'NothingMatches');

    await waitFor(() => {
      expect(screen.queryByText('Weekly Safety Audit')).not.toBeInTheDocument();
      expect(
        screen.getByText(/no master templates found/i),
      ).toBeInTheDocument();
    });
  });
});
