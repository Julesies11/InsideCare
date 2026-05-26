-- ==============================================================================
-- 🚀 JWT WEBHOOK AUTOMATION
-- ==============================================================================
-- This migration automates the Edge Function pings required for the Pure JWT model.
-- It ensures that any change in the database immediately triggers a JWT sync.

-- 1. Enable the HTTP extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the Webhook Dispatcher Function
-- Handles INSERT, UPDATE, and DELETE operations robustly.
CREATE OR REPLACE FUNCTION public.ic_dispatch_jwt_sync_webhook()
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_record jsonb;
  v_old_record jsonb;
BEGIN
  -- Safely handle NEW/OLD records based on the operation type
  IF (TG_OP = 'DELETE') THEN
    v_record := null;
    v_old_record := row_to_json(OLD)::jsonb;
  ELSIF (TG_OP = 'INSERT') THEN
    v_record := row_to_json(NEW)::jsonb;
    v_old_record := null;
  ELSE
    v_record := row_to_json(NEW)::jsonb;
    v_old_record := row_to_json(OLD)::jsonb;
  END IF;

  -- Dispatch the asynchronous HTTP POST request
  PERFORM net.http_post(
    url := 'https://rdnaqrzqpcicskylmsyl.supabase.co/functions/v1/ic-update-user-roles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY' -- 👈 REPLACE WITH VITE_SUPABASE_ANON_KEY
    ),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'record', v_record,
      'old_record', v_old_record
    )
  );
  
  -- Return the appropriate record for the trigger context
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Webhook Triggers

-- Trigger on ic_staff changes
DROP TRIGGER IF EXISTS ic_webhook_jwt_staff ON public.ic_staff;
CREATE TRIGGER ic_webhook_jwt_staff
AFTER INSERT OR UPDATE OR DELETE ON public.ic_staff
FOR EACH ROW EXECUTE FUNCTION public.ic_dispatch_jwt_sync_webhook();

-- Trigger on house assignment changes
DROP TRIGGER IF EXISTS ic_webhook_jwt_assignments ON public.ic_house_staff_assignments;
CREATE TRIGGER ic_webhook_jwt_assignments
AFTER INSERT OR UPDATE OR DELETE ON public.ic_house_staff_assignments
FOR EACH ROW EXECUTE FUNCTION public.ic_dispatch_jwt_sync_webhook();
