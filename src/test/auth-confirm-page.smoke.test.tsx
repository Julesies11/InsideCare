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
  it('renders without crashing (No WSoD)', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/auth/confirm']}>
        <Routes>
          <Route path="/auth/confirm" element={<ConfirmPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Verify main container renders and error boundary doesn't crash
    expect(container).toBeDefined();
    expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
  });
});
