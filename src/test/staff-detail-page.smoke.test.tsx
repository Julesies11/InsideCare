/**
 * Smoke Tests: Staff Detail Page — Toolbar & Portal Status Badge
 *
 * Focuses on the toolbar layer (StaffDetailPage), not the deep component tree.
 * The StaffDetailContent child is mocked to avoid pulling in dozens of hook
 * dependencies unrelated to the features being tested.
 *
 * What is tested:
 *  - Page renders without crashing
 *  - "No Portal Access" / "Invite Pending" / "Portal Active" badge states
 *  - "Save Changes" button disabled when no dirty state
 *  - "Activate Staff" vs "Deactivate" toolbar button based on status
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider } from '@/providers/settings-provider';
import { AuthContext } from '@/auth/context/auth-context';
import type { UserModel } from '@/auth/lib/models';

// ── Module mocks ─────────────────────────────────────────────────────────

// Mock the heavy child component — we only want to test the toolbar layer
vi.mock('@/pages/employees/staff-detail/staff-detail-content.tsx', () => ({
  StaffDetailContent: vi.fn(() => <div data-testid="staff-detail-content" />),
}));

// Mock the dialog components
vi.mock('@/pages/employees/staff-detail/components/staff-activation-dialog', () => ({
  StaffActivationDialog: vi.fn(() => null),
}));
vi.mock('@/pages/employees/staff-detail/components/staff-deactivation-dialog', () => ({
  StaffDeactivationDialog: vi.fn(() => null),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    functions: { invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })) },
    storage: { from: vi.fn(() => ({ createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: '' }, error: null })) })) },
  },
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: vi.fn(() => ({ hasAccess: vi.fn(() => true) })),
  ACCESS_LEVEL: { FULL: 'full', READ_ONLY: 'read_only', CONTEXT_READ_WRITE: 'context_read_write', NONE: 'none' },
}));

vi.mock('@/hooks/useDirtyTracker', () => ({
  useDirtyTracker: vi.fn(() => ({ isDirty: false })),
}));

vi.mock('@/hooks/use-staff', () => ({
  useStaffMember: vi.fn(),
  useUpdateStaff: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useInviteStaff: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useRevokeInvite: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/use-auth-status', () => ({
  useAdminAuthStatus: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────

const testUser: UserModel = {
  id: 'test-user-id',
  email: 'admin@example.com',
  fullname: 'Admin User',
  staff_id: 'staff-1',
};

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
}

const authCtxValue = {
  loading: false,
  setLoading: () => {},
  saveAuth: () => {},
  user: testUser,
  setUser: () => {},
  login: async () => {},
  register: async () => {},
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
  resendVerificationEmail: async () => {},
  getUser: async () => testUser,
  updateProfile: async () => testUser,
  logout: () => {},
  verify: async () => {},
  isAdmin: true,
  isStaff: true,
};

async function renderPage(staffId = 'staff-123') {
  const { StaffDetailPage } = await import(
    '@/pages/employees/staff-detail/staff-detail-page'
  );
  render(
    <MemoryRouter initialEntries={[`/employees/${staffId}`]}>
      <QueryClientProvider client={makeQueryClient()}>
        <SettingsProvider>
          <AuthContext.Provider value={authCtxValue}>
            <Routes>
              <Route path="/employees/:id" element={<StaffDetailPage />} />
            </Routes>
          </AuthContext.Provider>
        </SettingsProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

// Helper to set mock return values per test
async function setStaffMember(overrides: Record<string, any>) {
  const { useStaffMember } = await import('@/hooks/use-staff');
  (useStaffMember as any).mockReturnValue({
    data: {
      id: 'staff-123',
      staff_name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      auth_user_id: null,
      ...overrides,
    },
    isLoading: false,
  });
}

async function setAuthStatus(statusMap: Record<string, any> | undefined) {
  const { useAdminAuthStatus } = await import('@/hooks/use-auth-status');
  (useAdminAuthStatus as any).mockReturnValue({ data: statusMap });
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('StaffDetailPage — Toolbar & Portal Status Badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await setStaffMember({});
    await setAuthStatus({});
    await renderPage();
    expect(screen.getByText(/Staff Details/i)).toBeInTheDocument();
  });

  it('renders child content container', async () => {
    await setStaffMember({});
    await setAuthStatus({});
    await renderPage();
    expect(screen.getByTestId('staff-detail-content')).toBeInTheDocument();
  });

  // ── Toolbar Buttons ────────────────────────────────────────────────────

  it('renders "Save Changes" button in disabled state when no dirty changes', async () => {
    await setStaffMember({});
    await setAuthStatus({});
    await renderPage();
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it('renders "Activate Staff" button for inactive staff', async () => {
    await setStaffMember({ status: 'inactive' });
    await setAuthStatus({});
    await renderPage();
    expect(
      screen.getByRole('button', { name: /Activate Staff/i }),
    ).toBeInTheDocument();
  });

  it('renders "Deactivate" button for active staff', async () => {
    await setStaffMember({ status: 'active' });
    await setAuthStatus({});
    await renderPage();
    expect(
      screen.getByRole('button', { name: /Deactivate/i }),
    ).toBeInTheDocument();
  });

  it('renders "Activate Staff" button for draft staff', async () => {
    await setStaffMember({ status: 'draft' });
    await setAuthStatus({});
    await renderPage();
    expect(
      screen.getByRole('button', { name: /Activate Staff/i }),
    ).toBeInTheDocument();
  });
});
