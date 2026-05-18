-- Migration to remove 'status' column from 'staff_shifts' table
-- This field is no longer needed as per user request.

ALTER TABLE staff_shifts DROP COLUMN IF EXISTS status;
