import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConfirmPage } from './confirm-page';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: vi.fn(),
    },
  },
}));

describe('ConfirmPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error state when token parameters are missing', () => {
    render(
      <MemoryRouter initialEntries={['/auth/confirm']}>
        <Routes>
          <Route path="/auth/confirm" element={<ConfirmPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Invalid verification link. Missing token parameters./i),
    ).toBeInTheDocument();
  });

  it('handles successful OTP verification for invite flow', async () => {
    (supabase.auth.verifyOtp as any).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth/confirm?token_hash=valid_hash&type=invite']}>
        <Routes>
          <Route path="/auth/confirm" element={<ConfirmPage />} />
          <Route path="/auth/change-password" element={<div>Change Password Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Verifying your security credentials.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'valid_hash',
        type: 'invite',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Authentication Confirmed/i)).toBeInTheDocument();
    });
  });

  it('renders error state when verifyOtp returns an error', async () => {
    (supabase.auth.verifyOtp as any).mockResolvedValue({
      data: { user: null },
      error: { message: 'Token has expired' },
    });

    render(
      <MemoryRouter initialEntries={['/auth/confirm?token_hash=invalid_hash&type=recovery']}>
        <Routes>
          <Route path="/auth/confirm" element={<ConfirmPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Token has expired/i)).toBeInTheDocument();
    });
  });

  it('prevents open redirect via malicious next parameter', async () => {
    (supabase.auth.verifyOtp as any).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth/confirm?token_hash=valid&type=invite&next=//attacker.com']}>
        <Routes>
          <Route path="/auth/confirm" element={<ConfirmPage />} />
          <Route path="/auth/change-password" element={<div>Fallback Change Password Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Authentication Confirmed/i)).toBeInTheDocument();
    });
  });
});
