import { ShiftTemplatesPage } from '@/pages/roster-board/shift-templates';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from './test-utils';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn()
      .mockReturnValue(Promise.resolve({ data: null, error: null })),
    then: (onFulfilled: any) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({ data: { user: { id: '1' } }, error: null }),
        ),
        getSession: vi.fn(() =>
          Promise.resolve({ data: { session: null }, error: null }),
        ),
      },
    },
  };
});

// Mock RBAC hook
const mockHasAccess = vi.fn();
vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({
    hasAccess: mockHasAccess,
  }),
  ACCESS_LEVEL: {
    CONTEXT_READ_WRITE: 'context_read_write',
  },
}));

describe('ShiftTemplatesPage Smoke Test', () => {
  it('renders "Access Denied" when user has no permission', () => {
    mockHasAccess.mockReturnValue(false);

    renderWithProviders(<ShiftTemplatesPage />);

    expect(screen.getByText(/Access Denied/i)).toBeDefined();
    expect(
      screen.getByText(/You do not have the required permissions/i),
    ).toBeDefined();
  });

  it('renders house table when user has permission', () => {
    mockHasAccess.mockReturnValue(true);

    renderWithProviders(<ShiftTemplatesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Shift Templates/i }),
    ).toBeDefined();
    expect(screen.getByText(/House Shift Templates/i)).toBeDefined();
    expect(screen.getByText(/House Name/i)).toBeDefined();
    expect(screen.getAllByText(/Shift Templates/i).length).toBeGreaterThan(0);
  });
});
