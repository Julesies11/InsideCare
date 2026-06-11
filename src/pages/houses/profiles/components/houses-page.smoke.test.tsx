import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { HousesProfilesContent } from '../houses-basic-content';

const queryClient = new QueryClient();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({ hasAccess: () => true }),
  ACCESS_LEVEL: { CONTEXT_READ_WRITE: 'rw' },
}));

describe('HousesProfilesContent Smoke Test', () => {
  it('renders correctly', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <HousesProfilesContent />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/House Management/i)).toBeInTheDocument();
  });
});
