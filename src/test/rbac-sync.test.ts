import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncUserPermissions, syncUserPermissionsByStaffId } from '../lib/rbac-sync';
import { supabase } from '../lib/supabase';

// Mock supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('RBAC Sync Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncUserPermissions', () => {
    it('should return error if userId is missing', async () => {
      const result = await syncUserPermissions('');
      expect(result.error).toBe('userId is required');
    });

    it('should invoke edge function with correct userId', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { success: true }, error: null } as any);

      const userId = 'user-123';
      const result = await syncUserPermissions(userId);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ic-update-user-permissions', {
        body: { userId },
      });
      expect(result.data.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle edge function errors', async () => {
      const mockError = { message: 'Function error' };
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: null, error: mockError } as any);

      const result = await syncUserPermissions('user-123');
      expect(result.error).toEqual(mockError);
    });
  });

  describe('syncUserPermissionsByStaffId', () => {
    it('should return error if staffId is missing', async () => {
      const result = await syncUserPermissionsByStaffId('');
      expect(result.error).toBe('staffId is required');
    });

    it('should fetch auth_user_id and then sync', async () => {
      const staffId = 'staff-123';
      const authUserId = 'user-456';

      // Mock select().eq().single()
      const mockSingle = vi.fn().mockResolvedValueOnce({ 
        data: { auth_user_id: authUserId }, 
        error: null 
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabase.from).mockReturnValueOnce({ select: mockSelect } as any);
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { success: true }, error: null } as any);

      const result = await syncUserPermissionsByStaffId(staffId);

      expect(supabase.from).toHaveBeenCalledWith('ic_staff');
      expect(mockSelect).toHaveBeenCalledWith('auth_user_id');
      expect(mockEq).toHaveBeenCalledWith('id', staffId);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('ic-update-user-permissions', {
        body: { userId: authUserId },
      });
      expect(result.data.success).toBe(true);
    });

    it('should handle missing staff record', async () => {
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValueOnce({ select: mockSelect } as any);

      const result = await syncUserPermissionsByStaffId('staff-999');
      expect(result.error).toBe('Staff member has no linked Auth user');
    });
  });
});
