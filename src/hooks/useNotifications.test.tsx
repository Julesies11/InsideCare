import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications';
import { supabase } from '@/lib/supabase';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthContext } from '@/auth/context/auth-context';
import { ReactNode } from 'react';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({
              data: [
                { id: 'notif-1', is_read: false, type: 'alert', title: 'Test 1' },
                { id: 'notif-2', is_read: true, type: 'alert', title: 'Test 2' }
              ],
              count: 2,
              error: null
            })
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const mockUser = { id: 'user-123', email: 'test@test.com' };
const mockAuthContext = {
  auth: { access_token: 'token', refresh_token: 'token' },
  user: mockUser,
  loading: false,
  setLoading: vi.fn(),
  saveAuth: vi.fn(),
  setUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  resendVerificationEmail: vi.fn(),
  getUser: vi.fn(),
  updateProfile: vi.fn(),
  logout: vi.fn(),
  verify: vi.fn(),
  isAdmin: false,
  isStaff: true,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContext.Provider value={mockAuthContext as any}>
    {children}
  </AuthContext.Provider>
);

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notifications on mount', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for the async effect to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.unreadCount).toBe(1); // One is false, one is true
  });

  it('should mark all as read', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(result.current.notifications.every(n => n.is_read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });
});
