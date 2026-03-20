import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { AuthProvider } from './supabase-provider';
import { useAuth } from '@/auth/context/auth-context';
import { supabase } from '@/lib/supabase';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { ReactNode } from 'react';

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
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for onAuthStateChange to return a subscription
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('should initialize with null user if no session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
  });

  it('should fetch user profile if session exists on mount', async () => {
    const mockSession = { access_token: 'token', user: { id: '123' } };
    const mockProfile = { email: 'test@example.com', is_admin: true };

    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession }, error: null });
    (SupabaseAdapter.getCurrentUser as any).mockResolvedValue(mockProfile);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
  });

  it('should handle SIGNED_IN event', async () => {
    let authCallback: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initial load
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

    // Trigger SIGNED_IN
    const mockSession = { access_token: 'new-token' };
    const mockProfile = { email: 'new@example.com' };
    (SupabaseAdapter.getCurrentUser as any).mockResolvedValue(mockProfile);

    await waitFor(async () => {
      await authCallback('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('new@example.com');
    });
  });

  it('should handle SIGNED_OUT event', async () => {
    let authCallback: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const mockProfile = { email: 'initial@example.com' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });
    (SupabaseAdapter.getCurrentUser as any).mockResolvedValue(mockProfile);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('initial@example.com'));

    // Trigger SIGNED_OUT
    await waitFor(async () => {
      await authCallback('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });
  });
});
