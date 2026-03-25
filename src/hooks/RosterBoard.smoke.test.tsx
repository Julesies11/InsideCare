import { renderWithProviders, screen } from '@/test/test-utils';
import { RosterBoardContent } from '@/pages/roster-board/roster-board-content';
import { describe, it, expect, vi } from 'vitest';

// Mock everything needed for the complex Roster Board
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

describe('Roster Board Smoke Test', () => {
  it('renders the roster board and header', async () => {
    renderWithProviders(<RosterBoardContent />);
    
    // Check for title - wait for it if necessary or just check static text
    expect(screen.getByText(/Roster Board/i)).toBeInTheDocument();
    
    // Verify standard filter dropdowns are present via their placeholders
    expect(screen.getByText(/All Houses/i)).toBeInTheDocument();
  });
});
