import { useAuth } from '@/auth/context/auth-context';
import { ChangePasswordPage } from '@/auth/pages/change-password-page';
import { ConfirmPage } from '@/auth/pages/confirm-page';
import { ResetPasswordPage } from '@/auth/pages/reset-password-page';
import { SignInPage } from '@/auth/pages/signin-page';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

// Mock useAuth
vi.mock('@/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('Auth Pages Smoke Tests', () => {
  it('SignInPage renders correctly', () => {
    (useAuth as any).mockReturnValue({
      login: vi.fn(),
      getUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /Sign In/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('ResetPasswordPage renders correctly', () => {
    (useAuth as any).mockReturnValue({
      requestPasswordReset: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /Reset Password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('ChangePasswordPage renders correctly (verification state)', async () => {
    (useAuth as any).mockReturnValue({
      getUser: vi.fn(),
    });

    // Mock hash to trigger initializing state
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      hash: '#access_token=test&type=recovery',
    };

    render(
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Verifying link/i)).toBeInTheDocument();

    // Restore location
    (window as any).location = originalLocation;
  });

  it('ConfirmPage renders correctly (smoke test)', () => {
    render(
      <MemoryRouter initialEntries={['/auth/confirm']}>
        <ConfirmPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
  });

  it('SignInPage does not render hardcoded "Prod Admin" or "Prod Support" quick-login buttons', () => {
    (useAuth as any).mockReturnValue({
      login: vi.fn(),
      getUser: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>,
    );

    // These labels were removed as part of the production go-live cleanup.
    // They MUST NOT appear regardless of environment.
    expect(screen.queryByRole('button', { name: /^Prod Admin$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Prod Support$/i })).not.toBeInTheDocument();
  });
});
