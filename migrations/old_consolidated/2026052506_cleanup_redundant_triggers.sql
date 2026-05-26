-- Migration: Cleanup Redundant Audit Triggers
-- Date: 2026-05-25
-- Description: Removes specific triggers that were superseded by the universal trigger to prevent double-logging.

-- 1. Drop old specific triggers from ic_staff
DROP TRIGGER IF EXISTS ic_audit_staff_trigger ON ic_staff;

-- 2. Drop old specific triggers from ic_participants
DROP TRIGGER IF EXISTS ic_audit_participants_trigger ON ic_participants;

-- 3. Drop old specific triggers from ic_houses
DROP TRIGGER IF EXISTS ic_audit_houses_trigger ON ic_houses;

-- 4. Drop old specific triggers from ic_roles
DROP TRIGGER IF EXISTS ic_audit_roles_trigger ON ic_roles;

-- Note: The 'ic_audit_universal_trigger' (created in migration 2026052505) 
-- is now the single source of truth for all auditing.
