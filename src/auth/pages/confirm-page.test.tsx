import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { ConfirmPage } from './confirm-page';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: vi.fn(),
    },
  },
}));

// Mock react-router
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

describe('ConfirmPage (Unit & Smoke Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('renders verification error when token_hash or type parameters are missing', async () => {
    renderWithProviders(<ConfirmPage />);

    expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Invalid verification link\. Missing token parameters/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Sign In/i })).toBeInTheDocument();
  });

  it('renders confirmation screen when valid invitation parameters are present', async () => {
    mockSearchParams = new URLSearchParams({
      token_hash: 'valid-token-hash-123',
      type: 'invite',
    });

    renderWithProviders(<ConfirmPage />);

    expect(screen.getByText(/Accept Your Invitation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to InsideCare. Click below to verify your account and set up your password/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm & Continue/i })).toBeInTheDocument();
  });

  it('successfully verifies OTP and navigates on user click', async () => {
    mockSearchParams = new URLSearchParams({
      token_hash: 'valid-token-hash-123',
      type: 'invite',
      next: '/auth/change-password',
    });

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: { id: 'test-user-id' } as unknown as User, session: {} as unknown as Session },
      error: null,
    });

    const { user } = renderWithProviders(<ConfirmPage />);

    const confirmButton = screen.getByRole('button', { name: /Confirm & Continue/i });
    await user.click(confirmButton);

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'valid-token-hash-123',
      type: 'invite',
    });

    await waitFor(() => {
      expect(screen.getByText(/Authentication Confirmed/i)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/change-password', { replace: true });
      },
      { timeout: 2000 },
    );
  });

  it('displays error state when token verification fails', async () => {
    mockSearchParams = new URLSearchParams({
      token_hash: 'expired-token-hash',
      type: 'recovery',
    });

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Token has expired', name: 'AuthApiError', status: 400 },
    });

    const { user } = renderWithProviders(<ConfirmPage />);

    const confirmButton = screen.getByRole('button', { name: /Confirm & Continue/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Verification Link Expired or Invalid/i)).toBeInTheDocument();
      expect(screen.getByText(/Token has expired/i)).toBeInTheDocument();
    });
  });
});
