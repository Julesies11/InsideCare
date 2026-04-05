import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { RosterBoardContent } from './roster-board-content';
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase to return empty data for all metadata and shifts
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}));

describe('Roster Board Smoke Test', () => {
  it('renders the roster board without crashing', async () => {
    renderWithProviders(<RosterBoardContent />);
    
    // Check for core page elements
    expect(screen.getByText(/Roster Board/i)).toBeInTheDocument();
    
    // Check for the motivational banner text
    expect(screen.getByText(/Orchestrating Quality Care/i)).toBeInTheDocument();
    
    // Check for major action buttons
    expect(screen.getByText(/Export/i)).toBeInTheDocument();
    
    // Check for filter placeholders in RosterCalendarHeader
    await waitFor(() => {
      expect(screen.getByText(/All Houses/i)).toBeInTheDocument();
    });
  });
});
