-- Enable RLS on relevant tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STAFF table policies
-- ============================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to staff"
  ON staff FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Staff can only read their own row
CREATE POLICY "Staff can read own record"
  ON staff FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- ============================================================
-- LEAVE_TYPES table policies
-- ============================================================

-- All authenticated users can read leave types (needed for dropdowns)
CREATE POLICY "Authenticated users can read leave types"
  ON leave_types FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify leave types
CREATE POLICY "Admins can manage leave types"
  ON leave_types FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- ============================================================
-- LEAVE_REQUESTS table policies
-- ============================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Staff can read their own leave requests
CREATE POLICY "Staff can read own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can insert their own leave requests
CREATE POLICY "Staff can create own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can update their own pending leave requests
CREATE POLICY "Staff can update own pending leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    status = 'pending' AND
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- TIMESHEETS table policies
-- ============================================================

-- Admins can do everything
CREATE POLICY "Admins have full access to timesheets"
  ON timesheets FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Staff can read their own timesheets
CREATE POLICY "Staff can read own timesheets"
  ON timesheets FOR SELECT
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can insert their own timesheets
CREATE POLICY "Staff can create own timesheets"
  ON timesheets FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS table policies
-- ============================================================

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- All authenticated users can insert notifications (e.g. staff notifying admins)
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- SHIFT_NOTES table policies
-- ============================================================

ALTER TABLE shift_notes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to shift_notes"
  ON shift_notes FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Staff can read and create shift notes
CREATE POLICY "Staff can read all shift notes"
  ON shift_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create shift notes"
  ON shift_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update own shift notes"
  ON shift_notes FOR UPDATE
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- ============================================================
-- ACTIVITY_LOG table policies
-- ============================================================

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read activity log
CREATE POLICY "Authenticated users can read activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

-- Everyone can insert into activity log
CREATE POLICY "Authenticated users can insert activity log"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
