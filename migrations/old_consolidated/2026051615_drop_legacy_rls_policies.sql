-- Migration: Drop Legacy RLS Policies
-- Description: Removes early unrestricted policies that were overriding hardened RBAC logic and causing data leaks.

BEGIN;

-- 1. DROP UNRESTRICTED PARTICIPANT POLICIES
DROP POLICY IF EXISTS "Staff can select all participants" ON public.participants;
DROP POLICY IF EXISTS "Staff can select participant child entities" ON public.participant_medications;
DROP POLICY IF EXISTS "Staff can select participant notes" ON public.participant_notes;
DROP POLICY IF EXISTS "Staff can select participant goals" ON public.participant_goals;
DROP POLICY IF EXISTS "Staff can select participant goal progress" ON public.participant_goal_progress;
DROP POLICY IF EXISTS "Staff can select participant hygiene routines" ON public.participant_hygiene_routines;
DROP POLICY IF EXISTS "Staff can select participant contacts" ON public.participant_contacts;
DROP POLICY IF EXISTS "Staff can select participant restrictive practices" ON public.participant_restrictive_practices;

-- 2. DROP UNRESTRICTED HOUSE POLICIES
DROP POLICY IF EXISTS "Staff can select all houses" ON public.houses;
DROP POLICY IF EXISTS "Staff can select own house assignments" ON public.house_staff_assignments;

-- 3. DROP UNRESTRICTED SHIFT & OPERATIONAL POLICIES
DROP POLICY IF EXISTS "Staff can select staff shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Staff can select all shift notes" ON public.shift_notes;
DROP POLICY IF EXISTS "Staff select checklist templates" ON public.checklist_master;
DROP POLICY IF EXISTS "Staff select checklist item templates" ON public.checklist_item_master;

-- 4. DROP OTHER EARLY TRANSITIONAL POLICIES
DROP POLICY IF EXISTS "Staff can read own record" ON public.staff;
DROP POLICY IF EXISTS "Staff can select own compliance" ON public.staff_compliance;
DROP POLICY IF EXISTS "Staff can select own training" ON public.staff_training;
DROP POLICY IF EXISTS "Staff can select own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can select own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Staff can select own leave requests" ON public.leave_requests;

COMMIT;
