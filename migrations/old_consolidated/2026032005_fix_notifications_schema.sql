-- Fix notifications schema and RLS policies to match TypeScript implementation

-- ==========================================
-- PART 1: SCHEMA FIXES
-- ==========================================

-- 1. Add missing type column
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;

-- 2. Update existing rows to have a default type before making it NOT NULL
UPDATE public.notifications SET type = 'system_alert' WHERE type IS NULL;

-- 3. Make type NOT NULL
ALTER TABLE public.notifications ALTER COLUMN type SET NOT NULL;

-- 4. Rename message to body (if message column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN message TO body;
  END IF;
END $$;

-- 5. Add performance indices 
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications USING btree (user_id, is_read);

-- 6. Enable Realtime for notifications table so topbar toasts work
BEGIN;
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
    ) THEN
      -- Create the publication if it somehow doesn't exist (Supabase standard)
      IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
         CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
      END IF;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END $$;
COMMIT;

-- ==========================================
-- PART 2: RLS POLICY FIXES
-- ==========================================

-- 1. Remove the restrictive blanket policy
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;

-- 2. Create granular policies

-- Users can only read, update (mark as read), and delete their OWN notifications
CREATE POLICY "Users select own notifications" ON public.notifications 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own notifications" ON public.notifications 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- ANY authenticated user can INSERT a notification for someone else
CREATE POLICY "Users insert notifications" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (true);
