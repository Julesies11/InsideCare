-- Migration: Dynamic House Shift Model
-- Date: 2026-03-24
-- Description: Replaces hardcoded shift periods with a dynamic per-house shift model.

-- 1. Create the House Shift Types table
CREATE TABLE IF NOT EXISTS public.house_shift_types (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name text NOT NULL,
    short_name text NULL, -- e.g. 'M', 'D', 'N'
    icon_name text NULL, -- for UI icons
    color_theme text NULL, -- for period-specific colors
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT house_shift_types_pkey PRIMARY KEY (id),
    UNIQUE (house_id, name)
);

-- 2. Add foreign key to items
-- Note: We keep group_title for now to preserve existing data, but we'll transition to group_id
ALTER TABLE public.house_checklist_items ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;
ALTER TABLE public.checklist_item_master ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;

-- 3. Backfill common shift types for existing houses
-- This ensures the system doesn't break for existing data
DO $$
DECLARE
    r RECORD;
    v_m_id uuid;
    v_d_id uuid;
    v_n_id uuid;
BEGIN
    FOR r IN SELECT id FROM public.houses LOOP
        -- Morning
        INSERT INTO public.house_shift_types (house_id, name, short_name, icon_name, color_theme, sort_order)
        VALUES (r.id, 'Morning', 'M', 'sun', 'morning', 10)
        ON CONFLICT (house_id, name) DO UPDATE SET short_name = 'M'
        RETURNING id INTO v_m_id;

        -- Day
        INSERT INTO public.house_shift_types (house_id, name, short_name, icon_name, color_theme, sort_order)
        VALUES (r.id, 'Day', 'D', 'sun-dim', 'day', 20)
        ON CONFLICT (house_id, name) DO UPDATE SET short_name = 'D'
        RETURNING id INTO v_d_id;

        -- Night
        INSERT INTO public.house_shift_types (house_id, name, short_name, icon_name, color_theme, sort_order)
        VALUES (r.id, 'Night', 'N', 'moon', 'night', 30)
        ON CONFLICT (house_id, name) DO UPDATE SET short_name = 'N'
        RETURNING id INTO v_n_id;

        -- Link existing items to these new types based on their group_title
        UPDATE public.house_checklist_items 
        SET group_id = v_m_id 
        WHERE checklist_id IN (SELECT id FROM public.house_checklists WHERE house_id = r.id)
        AND (group_title = 'Morning' OR group_title = 'Morn');

        UPDATE public.house_checklist_items 
        SET group_id = v_d_id 
        WHERE checklist_id IN (SELECT id FROM public.house_checklists WHERE house_id = r.id)
        AND group_title = 'Day';

        UPDATE public.house_checklist_items 
        SET group_id = v_n_id 
        WHERE checklist_id IN (SELECT id FROM public.house_checklists WHERE house_id = r.id)
        AND group_title = 'Night';
    END LOOP;
END $$;

-- 4. Clean up old constraints (only if they exist)
-- We'll allow group_title to be NULL now since we'll use group_id
ALTER TABLE public.house_checklist_items ALTER COLUMN group_title DROP NOT NULL;
ALTER TABLE public.house_checklist_items DROP CONSTRAINT IF EXISTS house_checklist_items_group_title_check;

-- 5. Add RLS for the new table
ALTER TABLE public.house_shift_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view house_shift_types"
ON public.house_shift_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage house_shift_types"
ON public.house_shift_types FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.auth_user_id = auth.uid() AND (s.role_id IN (SELECT id FROM public.roles WHERE name = 'Administrator'))));

-- Add a comment for documentation
COMMENT ON TABLE public.house_shift_types IS 'Defines house-specific shift periods for task grouping.';
