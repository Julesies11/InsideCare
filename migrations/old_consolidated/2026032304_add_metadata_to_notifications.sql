-- Migration: Add metadata to notifications
-- Date: 2026-03-23

-- Add metadata column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb NULL;

-- Log the change
COMMENT ON COLUMN public.notifications.metadata IS 'JSON metadata for notification context (e.g. participantId, tab reference)';
