import { ReactNode } from 'react';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { useAuth } from '@/auth/context/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

// Test component to access context
const TestConsumer = () => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div data-testid="loading">Loading...</div>;
  return (
    <div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="is-admin">{isAdmin ? 'admin' : 'not-admin'}</div>
    </div>
  );
};

describe('AuthProvider', () => {
  let authCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;

    // Default mock for onAuthStateChange
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      // Trigger INITIAL_SESSION with null by default to simulate mount
      // We wrap in setTimeout to ensure it happens after the caller has a chance to set up
      setTimeout(() => cb('INITIAL_SESSION', null), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('should initialize with null user if no session exists', async () => {
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

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
  });

  it('should fetch user profile if session exists on mount', async () => {
    const mockSession = { access_token: 'token', user: { id: '123' } };
    const mockProfile = { email: 'test@example.com', is_admin: true };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    (SupabaseAdapter.getCurrentUser as any).mockResolvedValue(mockProfile);

    // Override the mock to provide the session immediately
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      setTimeout(() => cb('INITIAL_SESSION', mockSession), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
      { wrapper: Wrapper },
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('user-email')).toHaveTextContent(
          'test@example.com',
        );
      },
      { timeout: 5000 },
    );

    expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
  });

  it('should handle SIGNED_IN event', async () => {
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

    // Initial load
    await waitFor(() =>
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument(),
    );

    // Trigger SIGNED_IN
    const mockSession = { access_token: 'new-token', user: { id: 'user-1' } };
    const mockProfile = { email: 'new@example.com' };
    (SupabaseAdapter.getCurrentUser as any).mockResolvedValue(mockProfile);

    await act(async () => {
      await authCallback('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'new@example.com',
      );
    });
  });

  it('should handle SIGNED_OUT event', async () => {
    const mockProfile = { email: 'initial@example.com' };
    const mockSession = { access_token: 't', user: { id: '1' } };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    (SupabaseAdapter.getCurrentUser as any).mockResolvedValue(mockProfile);

    // Initial state with session
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      setTimeout(() => cb('INITIAL_SESSION', mockSession), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'initial@example.com',
      ),
    );

    // Trigger SIGNED_OUT
    await act(async () => {
      await authCallback('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });
  });
});
