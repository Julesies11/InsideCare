import { supabase } from '@/lib/supabase';

// Define strict types for all supported notifications to prevent typos
export type NotificationType = 
  | 'timesheet_approved'
  | 'timesheet_rejected'
  | 'timesheet_submitted'
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_submitted'
  | 'system_alert'
  | 'compliance_alert'
  | 'clinical_update'
  | 'shift_assigned'
  | 'shift_modified'
  | 'shift_cancelled'
  | 'medication_update'
  | 'routine_update';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Centralized service for creating in-app notifications.
 * All business logic for formatting and sending notifications should live here,
 * keeping the database dumb and the React components clean.
 */
export const NotificationService = {
  /**
   * Base method to insert a notification into the database.
   */
  async send({ userId, type, title, body, link }: SendNotificationParams): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link: link || null,
    });

    if (error) {
      console.error('Failed to send notification:', error);
      // We don't throw here to prevent non-critical notification failures from breaking core workflows (like saving a form)
    }
  },

  // ---------------------------------------------------------------------------
  // Domain-Specific Notification Helpers
  // ---------------------------------------------------------------------------

  async notifyTimesheetApproved(staffUserId: string, dateStr: string, notes?: string) {
    await this.send({
      userId: staffUserId,
      type: 'timesheet_approved',
      title: 'Timesheet Approved',
      body: notes || `Your timesheet for ${dateStr} has been approved.`,
      link: '/staff/timesheets',
    });
  },

  async notifyTimesheetRejected(staffUserId: string, dateStr: string, notes?: string) {
    await this.send({
      userId: staffUserId,
      type: 'timesheet_rejected',
      title: 'Timesheet Rejected',
      body: notes || `Your timesheet for ${dateStr} requires revision.`,
      link: '/staff/timesheets',
    });
  },

  async notifyTimesheetSubmitted(adminUserId: string, staffName: string, dateStr: string) {
    await this.send({
      userId: adminUserId,
      type: 'timesheet_submitted',
      title: 'Timesheet Submitted',
      body: `${staffName} has submitted a timesheet for ${dateStr}.`,
      link: '/employees/timesheets',
    });
  },

  async notifyLeaveApproved(staffUserId: string, dateRangeStr: string, leaveType: string, notes?: string) {
    await this.send({
      userId: staffUserId,
      type: 'leave_approved',
      title: 'Leave Request Approved',
      body: notes || `Your ${leaveType} request (${dateRangeStr}) has been approved.`,
      link: '/staff/leave',
    });
  },

  async notifyLeaveRejected(staffUserId: string, dateRangeStr: string, leaveType: string, notes?: string) {
    await this.send({
      userId: staffUserId,
      type: 'leave_rejected',
      title: 'Leave Request Rejected',
      body: notes || `Your ${leaveType} request (${dateRangeStr}) has been rejected.`,
      link: '/staff/leave',
    });
  },

  async notifyLeaveSubmitted(adminUserId: string, staffName: string, dateRangeStr: string, leaveType: string) {
    await this.send({
      userId: adminUserId,
      type: 'leave_submitted',
      title: 'New Leave Request',
      body: `${staffName} has submitted a ${leaveType} request for ${dateRangeStr}.`,
      link: '/employees/leave-requests',
    });
  },

  // ---------------------------------------------------------------------------
  // Shift Alerts
  // ---------------------------------------------------------------------------

  async notifyShiftAssigned(staffUserId: string, dateStr: string, houseName: string) {
    await this.send({
      userId: staffUserId,
      type: 'shift_assigned',
      title: 'New Shift Assigned',
      body: `You have been assigned a new shift at ${houseName} on ${dateStr}.`,
      link: '/staff/roster',
    });
  },

  async notifyShiftModified(staffUserId: string, dateStr: string, houseName: string) {
    await this.send({
      userId: staffUserId,
      type: 'shift_modified',
      title: 'Shift Modified',
      body: `Your shift at ${houseName} on ${dateStr} has been updated.`,
      link: '/staff/roster',
    });
  },

  async notifyShiftCancelled(staffUserId: string, dateStr: string, houseName: string) {
    await this.send({
      userId: staffUserId,
      type: 'shift_cancelled',
      title: 'Shift Cancelled',
      body: `Your shift at ${houseName} on ${dateStr} has been cancelled.`,
      link: '/staff/roster',
    });
  },

  // ---------------------------------------------------------------------------
  // Clinical Alerts
  // ---------------------------------------------------------------------------

  async notifyClinicalUpdate(staffUserId: string, participantName: string, updateType: 'medication' | 'routine' | 'note') {
    const titles = {
      medication: 'Medication Update',
      routine: 'Routine Update',
      note: 'New Important Note',
    };

    const type: NotificationType = updateType === 'medication' ? 'medication_update' : 'routine_update';

    await this.send({
      userId: staffUserId,
      type,
      title: titles[updateType],
      body: `A clinical update has been recorded for ${participantName}. Please review before your next shift.`,
      link: '/participants/profiles',
    });
  },

  /**
   * Helper to notify all staff assigned to a specific house about a participant update.
   */
  async notifyAssignedStaff(houseId: string, participantName: string, updateType: 'medication' | 'routine' | 'note') {
    // Fetch staff assigned to this house
    const { data: assignments } = await supabase
      .from('house_staff_assignments')
      .select('staff:staff_id(auth_user_id)')
      .eq('house_id', houseId);

    if (assignments && assignments.length > 0) {
      const userIds = assignments
        .map(a => (a.staff as any)?.auth_user_id)
        .filter(Boolean) as string[];

      await Promise.all(
        userIds.map(uid => this.notifyClinicalUpdate(uid, participantName, updateType))
      );
    }
  },

  // ---------------------------------------------------------------------------
  // Compliance Alerts
  // ---------------------------------------------------------------------------

  async notifyComplianceExpiry(userId: string, documentName: string, expiryDateStr: string, isAdmin = false) {
    await this.send({
      userId,
      type: 'compliance_alert',
      title: 'Document Expiry Warning',
      body: `The ${documentName} is set to expire on ${expiryDateStr}.`,
      link: isAdmin ? '/employees/staff-profiles' : '/staff/profile',
    });
  },
};
