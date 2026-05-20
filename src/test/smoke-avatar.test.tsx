import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { StaffDetailPage } from '@/pages/employees/staff-detail/staff-detail-page';
import { ParticipantDetailPage } from '@/pages/participants/detail/participant-detail-page';

// Mock hooks and router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ id: 'test-id' }),
  };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-scroll-position', () => ({
  useScrollPosition: () => 0,
}));

describe('Avatar Integration Smoke Tests', () => {
  it('StaffDetailPage renders without crashing', async () => {
    renderWithProviders(<StaffDetailPage />);
    expect(screen.getByRole('heading', { name: /staff details/i })).toBeInTheDocument();
  });

  it('ParticipantDetailPage renders without crashing', async () => {
    renderWithProviders(<ParticipantDetailPage />);
    expect(screen.getByRole('heading', { name: /participant details/i })).toBeInTheDocument();
  });

  it('AvatarInput is present in Personal Details', async () => {
    renderWithProviders(<StaffDetailPage />);
    await waitFor(() => {
      // The label for the photo input
      expect(screen.getByText(/profile photo/i)).toBeInTheDocument();
    });
  });
});
