import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';
import * as useRBACModule from '@/hooks/useRBAC';
import { HouseDetailContent } from './house-detail-content';

// Mock hooks and supabase as in the main smoke test
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'house-1' })),
  };
});

const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(() =>
    Promise.resolve({
      data: { id: 'house-1', house_name: 'Test House' },
      error: null,
    }),
  ),
  maybeSingle: vi.fn(() =>
    Promise.resolve({
      data: { id: 'house-1', house_name: 'Test House' },
      error: null,
    }),
  ),
  then: vi.fn((onFulfilled) =>
    Promise.resolve({ data: [], error: null }).then(onFulfilled),
  ),
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: '1' } }, error: null }),
      ),
    },
    storage: { from: vi.fn(() => ({ remove: vi.fn() })) },
  },
}));

// Mock useRBAC
vi.mock('@/hooks/useRBAC', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useRBAC: vi.fn(),
  };
});

describe('House Granular Security UI Enforcement', () => {
  const mockPendingChanges = {
    participants: { toAdd: [], toUpdate: [], toDelete: [] },
    staff: { toAdd: [], toUpdate: [], toDelete: [] },
    calendarEvents: { toAdd: [], toUpdate: [], toDelete: [] },
    documents: { toAdd: [], toUpdate: [], toDelete: [] },
    checklists: {
      toAdd: [],
      toUpdate: [],
      toDelete: [],
      checklistItems: { toAdd: [], toUpdate: [], toDelete: [] },
    },
    forms: { toAdd: [], toUpdate: [], toDelete: [] },
    resources: { toAdd: [], toUpdate: [], toDelete: [] },
    comms: { toAdd: [], toUpdate: [], toDelete: [] },
    shiftTemplates: { toAdd: [], toUpdate: [], toDelete: [] },
  };

  const setupRBACMock = (permissions: Record<string, string>) => {
    vi.mocked(useRBACModule.useRBAC).mockReturnValue({
      hasAccess: vi.fn(({ resource, requiredLevel }) => {
        const userLevel = permissions[resource] || ACCESS_LEVEL.NONE;
        const levels = [
          ACCESS_LEVEL.NONE,
          ACCESS_LEVEL.CONTEXT_READ_ONLY,
          ACCESS_LEVEL.READ_ONLY,
          ACCESS_LEVEL.CONTEXT_READ_WRITE,
          ACCESS_LEVEL.FULL,
        ];
        return (
          levels.indexOf(userLevel as any) >= levels.indexOf(requiredLevel)
        );
      }),
      permissions,
      isAdmin: false,
    });
  };

  it('hides sections when user has NONE permission', async () => {
    setupRBACMock({
      [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.READ_ONLY,
      [RBAC_MODULES.HOUSE_MANAGEMENT]: ACCESS_LEVEL.NONE,
      [RBAC_MODULES.HOUSE_OPERATIONS]: ACCESS_LEVEL.NONE,
    });

    renderWithProviders(
      <HouseDetailContent
        pendingChanges={mockPendingChanges as any}
        onPendingChangesChange={() => {}}
        canEdit={false}
      />,
    );

    await waitFor(() => {
      // Basics should be visible
      expect(screen.queryByText(/House Name/i)).toBeInTheDocument();
      // Management and Operations should be hidden (check for CardTitle headings)
      expect(
        screen.queryByRole('heading', { name: /House Management/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: /Daily Operations/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('locks fields when user has READ_ONLY permission', async () => {
    setupRBACMock({
      [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.READ_ONLY,
    });

    renderWithProviders(
      <HouseDetailContent
        pendingChanges={mockPendingChanges as any}
        onPendingChangesChange={() => {}}
        canEdit={false}
      />,
    );

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(/Enter house name/i);
      expect(nameInput).toBeDisabled();
    });
  });

  it('enables fields when user has CONTEXT_READ_WRITE permission', async () => {
    setupRBACMock({
      [RBAC_MODULES.HOUSES]: ACCESS_LEVEL.CONTEXT_READ_WRITE,
    });

    renderWithProviders(
      <HouseDetailContent
        pendingChanges={mockPendingChanges as any}
        onPendingChangesChange={() => {}}
        canEdit={true}
      />,
    );

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(/Enter house name/i);
      expect(nameInput).not.toBeDisabled();
    });
  });
});
