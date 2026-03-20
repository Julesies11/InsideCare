import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseAdapter } from './supabase-adapter';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('SupabaseAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should correctly map user metadata and staff record to UserModel', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2023-01-01T00:00:00Z',
        user_metadata: {
          first_name: 'John',
          last_name: 'Doe',
          is_admin: true,
        },
      };

      const mockStaff = {
        id: 'staff-456',
        name: 'John Doe Staff',
        photo_url: 'https://example.com/photo.jpg',
        role: { name: 'Super Admin' },
      };

      // Mock auth.getUser
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });

      // Mock staff table query
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockStaff, error: null });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const profile = await SupabaseAdapter.getUserProfile();

      expect(profile).toEqual({
        email: 'test@example.com',
        email_verified: true,
        username: '',
        first_name: 'John',
        last_name: 'Doe',
        fullname: 'John Doe',
        occupation: '',
        company_name: '',
        phone: '',
        roles: [],
        pic: '',
        language: 'en',
        is_admin: true,
        staff_id: 'staff-456',
        staff_name: 'John Doe Staff',
        photo_url: 'https://example.com/photo.jpg',
        role_name: 'Super Admin',
      });

      expect(supabase.from).toHaveBeenCalledWith('staff');
      expect(mockEq).toHaveBeenCalledWith('auth_user_id', 'user-123');
    });

    it('should handle missing staff record gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null,
        user_metadata: {
          first_name: 'Regular',
          last_name: 'User',
        },
      };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock staff table query returning null
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const profile = await SupabaseAdapter.getUserProfile();

      expect(profile.staff_id).toBeUndefined();
      expect(profile.email_verified).toBe(false);
      expect(profile.fullname).toBe('Regular User');
    });

    it('should throw error if user is not found', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null }, error: new Error('Not found') });

      await expect(SupabaseAdapter.getUserProfile()).rejects.toThrow('Not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user metadata and return fresh profile', async () => {
      const updates = { first_name: 'Jane', last_name: 'Smith' };
      
      (supabase.auth.updateUser as any).mockResolvedValue({ data: {}, error: null });
      
      // Mock getUserProfile after update
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { first_name: 'Jane', last_name: 'Smith' },
      };
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
      
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const profile = await SupabaseAdapter.updateUserProfile(updates);

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: expect.objectContaining({
          first_name: 'Jane',
          last_name: 'Smith',
        }),
      });
      expect(profile.first_name).toBe('Jane');
    });
  });
});
