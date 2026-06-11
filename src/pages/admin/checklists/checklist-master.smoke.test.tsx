import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/providers/settings-provider';
import { ChecklistMasterPage } from './checklist-master-page';

const queryClient = new QueryClient();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
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

describe('ChecklistMasterPage Smoke Test', () => {
  it('renders correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <ChecklistMasterPage />
        </SettingsProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Checklist Master/i)).toBeInTheDocument();
  });
});
