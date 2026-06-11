import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { supabase } from '@/lib/supabase';
import { LeaveDialog } from './leave-dialog';

// Helper to create a mock query chain
const createMockQuery = (data: any = [], error: any = null) => {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    insert: vi.fn().mockResolvedValue({ data: null, error }),
    update: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((callback) => {
      return Promise.resolve({ data, error }).then(callback);
    }),
  };
  return query;
};

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'http://example.com/file.jpg' },
          error: null,
        }),
      })),
    },
  },
}));

describe('LeaveDialog Component', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for leave_types
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === TABLES.LEAVE_TYPES) {
        return createMockQuery([{ id: 'lt1', name: 'Annual Leave' }]);
      }
      return createMockQuery([]);
    });
  });

  it('renders "New Leave Request" title when no leaveId is provided', async () => {
    renderWithProviders(
      <LeaveDialog open={true} onOpenChange={mockOnOpenChange} />,
    );
    expect(screen.getByText(/New Leave Request/i)).toBeInTheDocument();
  });

  it('renders "Edit Leave Request" title when leaveId is provided', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === TABLES.LEAVE_REQUESTS) {
        return createMockQuery({
          leave_type_id: 'lt1',
          start_date: '2026-05-01',
          end_date: '2026-05-05',
          reason: 'Vacation',
          attachment_url: null,
        });
      }
      if (table === TABLES.LEAVE_TYPES) {
        return createMockQuery([{ id: 'lt1', name: 'Annual Leave' }]);
      }
      return createMockQuery([]);
    });

    renderWithProviders(
      <LeaveDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        leaveId="test-leave-id"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Edit Leave Request/i)).toBeInTheDocument();
    });
  });

  it('displays conflict warning when rostered shifts exist in the date range', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === TABLES.STAFF_SHIFTS) {
        return createMockQuery([
          {
            id: 's1',
            start_date: '2026-04-15',
            house: { house_name: 'Test House' },
          },
        ]);
      }
      if (table === TABLES.LEAVE_TYPES) {
        return createMockQuery([{ id: 'lt1', name: 'Annual Leave' }]);
      }
      return createMockQuery([]);
    });

    renderWithProviders(
      <LeaveDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        initialDate="2026-04-15"
      />,
    );

    await waitFor(
      () => {
        expect(
          screen.getByText(/1 rostered shift overlap/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('shows submit button', async () => {
    renderWithProviders(
      <LeaveDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Submit Request/i }),
      ).toBeInTheDocument();
    });
  });
});
