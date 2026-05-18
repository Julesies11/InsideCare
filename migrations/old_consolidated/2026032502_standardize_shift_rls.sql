-- Migration: Standardize RLS for Shift Models
-- Date: 2026-03-25
-- Description: Standardizes RLS policies to allow authenticated users to manage shift models, matching checklist/participant patterns.

-- 1. Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Allow admins to manage house_shift_types" ON public.house_shift_types;

-- 2. Add standardized manage policy
CREATE POLICY "Allow authenticated to manage house_shift_types"
ON public.house_shift_types FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Standardize Template Groups (just in case)
DROP POLICY IF EXISTS "Allow admin manage template groups" ON public.shift_template_groups;
CREATE POLICY "Allow authenticated to manage template groups"
ON public.shift_template_groups FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Standardize Template Items
DROP POLICY IF EXISTS "Allow admin manage template items" ON public.shift_template_items;
CREATE POLICY "Allow authenticated to manage template items"
ON public.shift_template_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
