import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notification-service';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('should call supabase.from().insert() with correct parameters', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({ insert: mockInsert });

      await NotificationService.send({
        userId: 'user-1',
        type: 'system_alert',
        title: 'Test Alert',
        body: 'Test Body',
        link: '/test',
      });

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        type: 'system_alert',
        title: 'Test Alert',
        body: 'Test Body',
        link: '/test',
      });
    });

    it('should handle null optional fields', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({ insert: mockInsert });

      await NotificationService.send({
        userId: 'user-1',
        type: 'system_alert',
        title: 'Test Alert',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        type: 'system_alert',
        title: 'Test Alert',
        body: null,
        link: null,
      });
    });
  });

  describe('domain helpers', () => {
    it('notifyTimesheetApproved', async () => {
      const spy = vi.spyOn(NotificationService, 'send').mockResolvedValue();
      await NotificationService.notifyTimesheetApproved('user-1', '2023-01-01');
      expect(spy).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'timesheet_approved',
        title: 'Timesheet Approved',
        body: 'Your timesheet for 2023-01-01 has been approved.',
        link: '/staff/timesheets',
      });
    });

    it('notifyClinicalUpdate', async () => {
      const spy = vi.spyOn(NotificationService, 'send').mockResolvedValue();
      await NotificationService.notifyClinicalUpdate('user-1', 'John Doe', 'medication');
      expect(spy).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'medication_update',
        title: 'Medication Update',
        body: 'A clinical update has been recorded for John Doe. Please review before your next shift.',
        link: '/participants/profiles',
      });
    });
  });

  describe('notifyAssignedStaff', () => {
    it('should fetch assignments and notify each staff member', async () => {
      const mockAssignments = [
        { staff: { auth_user_id: 'user-1' } },
        { staff: { auth_user_id: 'user-2' } },
        { staff: null }, // edge case test
      ];

      const mockEq = vi.fn().mockResolvedValue({ data: mockAssignments, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const spy = vi.spyOn(NotificationService, 'notifyClinicalUpdate').mockResolvedValue();

      await NotificationService.notifyAssignedStaff('house-1', 'John Doe', 'note');

      expect(supabase.from).toHaveBeenCalledWith('house_staff_assignments');
      expect(mockSelect).toHaveBeenCalledWith('staff:staff_id(auth_user_id)');
      expect(mockEq).toHaveBeenCalledWith('house_id', 'house-1');

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith('user-1', 'John Doe', 'note');
      expect(spy).toHaveBeenCalledWith('user-2', 'John Doe', 'note');
    });
  });
});