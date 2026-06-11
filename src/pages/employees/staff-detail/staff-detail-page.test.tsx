import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/test-utils';
import { StaffRow } from '@/test/type-helpers';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { StaffDetailPage } from './staff-detail-page';
import { Route, Routes } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockStaff: Partial<StaffRow> = {
  id: 'staff-1',
  staff_name: 'John Staff',
  email: 'john.staff@example.com',
  status: 'active',
  auth_user_id: 'test-user-id',
};

// Mock hooks that use browser APIs
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-scroll-position', () => ({
  useScrollPosition: () => 0,
}));

vi.setConfig({ testTimeout: 15000 });

describe('StaffDetailPage', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF}`, ({ request }) => {
        if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(mockStaff);
        }
        return HttpResponse.json([mockStaff]);
      }),
      http.patch(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF}`, () => {
        return HttpResponse.json([mockStaff]);
      }),
    );
  });

  const renderPage = () => {
    return renderWithProviders(
      <Routes>
        <Route path="/staff/:id" element={<StaffDetailPage />} />
      </Routes>,
      { route: '/staff/staff-1' }
    );
  };

  it('renders the page with toolbar and content', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: /staff details/i }),
    ).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('John Staff')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });

  it('enables save button when data is changed', async () => {
    const { user } = renderPage();

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('John Staff')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();

    const nameInput = screen.getByDisplayValue('John Staff');
    await user.clear(nameInput);
    await user.type(nameInput, 'John Updated');

    await waitFor(
      () => {
        expect(nameInput).toHaveValue('John Updated');
      },
      { timeout: 5000 },
    );

    expect(saveBtn).toBeEnabled();
  }, 20000);

  it('calls update mutation when save is clicked', async () => {
    const updateSpy = vi.fn();
    server.use(
      http.patch(
        `${SUPABASE_URL}/rest/v1/${TABLES.STAFF}`,
        async ({ request }) => {
          const body = await request.json();
          updateSpy(body);
          return HttpResponse.json({ ...mockStaff, ...body });
        },
      ),
    );

    const { user } = renderPage();

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('John Staff')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const nameInput = screen.getByDisplayValue('John Staff');
    await user.clear(nameInput);
    await user.type(nameInput, 'John Updated');

    await waitFor(
      () => {
        expect(nameInput).toHaveValue('John Updated');
      },
      { timeout: 5000 },
    );

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    await waitFor(
      () => {
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            staff_name: 'John Updated',
          }),
        );
      },
      { timeout: 10000 },
    );
  }, 20000);
});
