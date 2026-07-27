import { useAuth } from '@/auth/context/auth-context';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from './landing-page';
import { ROUTES } from '@/config/routes.config';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock lucide-react icons to avoid missing exports and test rendering issues
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return new Proxy(actual, {
    get: (target, prop) => {
      if (typeof prop === 'string' && prop[0] === prop[0].toUpperCase()) {
        return () => <div data-testid={`icon-${prop}`} />;
      }
      return Reflect.get(target, prop);
    },
  });
});

describe('LandingPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading screen when auth context is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      auth: null,
      isAdmin: false,
      loading: true,
    } as any);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Disability Care Management Platform')).not.toBeInTheDocument();
  });

  it('renders landing page content when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      auth: null,
      isAdmin: false,
      loading: false,
    } as any);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Disability Care Management Platform')).toBeInTheDocument();
    expect(screen.getByText('Additional Platform Pillars')).toBeInTheDocument();
    expect(screen.getAllByText('Sarah Connor').length).toBeGreaterThan(0);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('redirects to dashboard when logged in as admin', () => {
    vi.mocked(useAuth).mockReturnValue({
      auth: { access_token: 'admin-token' },
      isAdmin: true,
      loading: false,
    } as any);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.DASHBOARD, { replace: true });
  });

  it('redirects to staff dashboard when logged in as worker', () => {
    vi.mocked(useAuth).mockReturnValue({
      auth: { access_token: 'worker-token' },
      isAdmin: false,
      loading: false,
    } as any);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MY_DASHBOARD, { replace: true });
  });
});
