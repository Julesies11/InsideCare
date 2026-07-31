import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmPage } from '@/auth/pages/confirm-page';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));

describe('ConfirmPage Smoke Test', () => {
  it('renders without crashing on missing parameters (No WSoD)', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/auth/confirm']}>
        <Routes>
          <Route path="/auth/confirm" element={<ConfirmPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Verify main container renders and error state displays when parameters are missing
    expect(container).toBeDefined();
    expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
  });

  it('renders initial confirmation landing screen without crashing (No WSoD)', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/auth/confirm?token_hash=test&type=invite']}>
        <Routes>
          <Route path="/auth/confirm" element={<ConfirmPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Verify landing screen renders with primary CTA button
    expect(container).toBeDefined();
    expect(screen.getByText(/Accept Your Invitation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm & Continue/i })).toBeInTheDocument();
  });
});

