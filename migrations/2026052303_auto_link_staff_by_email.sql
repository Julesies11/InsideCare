-- Shared-DB Friendly Auto-Linker
-- This trigger automatically links an ic_staff record to a Supabase Auth user
-- based on their email address, without needing to touch the auth.users table.

CREATE OR REPLACE FUNCTION public.ic_trigger_auto_link_staff_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- If auth_user_id is already set, do nothing
  IF NEW.auth_user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Attempt to find the user in auth.users by email
  -- Note: We assume the email is stored in a column named 'email' on ic_staff
  SELECT id INTO NEW.auth_user_id
  FROM auth.users
  WHERE email = NEW.email
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Security definer needed to read auth.users

-- Apply to ic_staff
DROP TRIGGER IF EXISTS ic_trigger_auto_link_staff ON public.ic_staff;
CREATE TRIGGER ic_trigger_auto_link_staff
BEFORE INSERT OR UPDATE OF email ON public.ic_staff
FOR EACH ROW
EXECUTE FUNCTION public.ic_trigger_auto_link_staff_to_auth();

-- One-time sync: Link all existing staff records that are missing their auth_user_id
UPDATE public.ic_staff s
SET auth_user_id = u.id
FROM auth.users u
WHERE s.auth_user_id IS NULL
AND s.email = u.email;
