import { render, screen } from '@testing-library/react';
import { RolesPage } from './roles-page';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

const queryClient = new QueryClient();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({ hasAccess: () => true }),
  ACCESS_LEVEL: { CONTEXT_READ_WRITE: 'rw' },
}));

describe('RolesPage Smoke Test', () => {
  it('renders correctly', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <RolesPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Role Management/i)).toBeInTheDocument();
  });
});
