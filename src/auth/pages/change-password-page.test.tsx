import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { ChangePasswordPage } from './change-password-page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      updateUser: vi.fn(),
    }
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

describe('ChangePasswordPage (Gold Standard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reset instructions when no session is found', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    
    renderWithProviders(<ChangePasswordPage />);
    
    // Wait for the verification timer and potential polling
    await waitFor(() => {
      expect(screen.queryByText(/Verifying link/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders the password form when a valid session is found', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ 
      data: { 
        session: { 
          user: { 
            id: 'invited-user-id',
            email: 'staff@example.com',
            app_metadata: { is_admin: false } 
          } 
        } 
      }, 
      error: null 
    });
    
    renderWithProviders(<ChangePasswordPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Set New Password/i)).toBeInTheDocument();
      expect(screen.getByText(/staff@example.com/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    });
  });

  it('prevents password change and shows warning if an Admin session is active', async () => {
    // Simulate an Admin clicking the link while still logged in
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ 
      data: { 
        session: { 
          user: { 
            id: 'admin-user-id',
            app_metadata: { is_admin: true } // Admin flag
          } 
        } 
      }, 
      error: null 
    });
    
    renderWithProviders(<ChangePasswordPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Admin Session Detected/i)).toBeInTheDocument();
      // Use a more flexible matcher for the alert text
      expect(screen.getByText(/To prevent accidentally changing your Admin password/i)).toBeInTheDocument();
      // Form should NOT be visible
      expect(screen.queryByLabelText(/New Password/i)).not.toBeInTheDocument();
    });
  });

  it('successfully updates password and redirects to dashboard', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ 
      data: { 
        session: { 
          user: { 
            id: 'staff-user-id',
            app_metadata: { is_admin: false } 
          } 
        } 
      }, 
      error: null 
    });
    
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: {}, error: null });

    const { user } = renderWithProviders(<ChangePasswordPage />);
    
    // Wait for form
    await waitFor(() => expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument());
    
    // Fill form
    await user.type(screen.getByLabelText(/^New Password/i), 'NewSecurePass123!');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'NewSecurePass123!');
    
    // Submit
    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'NewSecurePass123!' });
      expect(screen.getByText(/Password set successfully/i)).toBeInTheDocument();
    });

    // Check redirect (after 1500ms timeout in code)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/staff/dashboard');
    }, { timeout: 2000 });
  });
});
