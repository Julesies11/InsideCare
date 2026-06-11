import { ReactNode } from 'react';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { useAuth } from '@/auth/context/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from './supabase-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

// Mock SupabaseAdapter
vi.mock('@/auth/adapters/supabase-adapter', () => ({
  SupabaseAdapter: {
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@/lib/rbac-sync', () => ({
  syncUserPermissions: vi.fn().mockResolvedValue(true),
}));

const TestConsumer = () => {
  const { user, loading } = useAuth();
  if (loading) return <div data-testid="loading">Loading...</div>;
  return <div data-testid="user-email">{user?.email || 'no-user'}</div>;
};

describe('AuthProvider Concurrency & Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should wait for onAuthStateChange and avoid double-calling getSession during the quiet period', async () => {
    vi.useFakeTimers();
    let authCallback: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
      { wrapper: Wrapper },
    );

    expect(supabase.auth.getSession).not.toHaveBeenCalled();

    // Trigger onAuthStateChange within the quiet period
    await act(async () => {
      authCallback('INITIAL_SESSION', null);
    });

    // Advance timers past the quiet period
    act(() => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it('should use getSession fallback if onAuthStateChange does not fire within the quiet period', async () => {
    vi.useFakeTimers();
    (supabase.auth.onAuthStateChange as any).mockImplementation(() => {
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
      { wrapper: Wrapper },
    );

    expect(supabase.auth.getSession).not.toHaveBeenCalled();

    // Advance timers past the quiet period (200ms)
    act(() => {
      vi.advanceTimersByTime(250);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('should prevent concurrent profile fetches using singleton promise', async () => {
    // No fake timers needed here as we are testing logic flow
    let authCallback: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const mockProfile = { email: 'concurrent@example.com' };
    let fetchCount = 0;
    (SupabaseAdapter.getCurrentUser as any).mockImplementation(async () => {
      fetchCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockProfile;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
      { wrapper: Wrapper },
    );

    const mockSession = { access_token: 't', user: { id: '1' } };

    await act(async () => {
      // Fire multiple events
      authCallback('INITIAL_SESSION', mockSession);
      authCallback('TOKEN_REFRESHED', mockSession);
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('user-email')).toHaveTextContent(
          'concurrent@example.com',
        );
      },
      { timeout: 2000 },
    );

    expect(fetchCount).toBe(1);
  });
});
