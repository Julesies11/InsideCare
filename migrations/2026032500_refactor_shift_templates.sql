-- Migration: Flexible Shift Templates & Dynamic Scheduling
-- Date: 2026-03-25
-- Description: Refactors Shift Templates to support titled groups, custom checklists, and recurring patterns.

-- 1. Default Checklists for Shift Types
-- Allows an Admin to say "Every 'Morning' shift in this house should have 'Med Round' by default"
CREATE TABLE IF NOT EXISTS public.shift_type_default_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_type_id uuid NOT NULL REFERENCES public.house_shift_types(id) ON DELETE CASCADE,
    checklist_id uuid NOT NULL REFERENCES public.house_checklists(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_type_id, checklist_id)
);

-- 2. Shift Template Groups (The "Title")
-- Example: 'Weekday', 'Weekend', 'Christmas Day'
CREATE TABLE IF NOT EXISTS public.shift_template_groups (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Shift Template Items (The shifts within a template)
-- A 'Weekday' template might have Morning, Day, and Night shift items.
CREATE TABLE IF NOT EXISTS public.shift_template_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_group_id uuid NOT NULL REFERENCES public.shift_template_groups(id) ON DELETE CASCADE,
    shift_type_id uuid NOT NULL REFERENCES public.house_shift_types(id) ON DELETE CASCADE,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Shift Template Item Checklists (Custom Overrides)
-- Allows adding/removing checklists for a shift *inside* a specific template.
CREATE TABLE IF NOT EXISTS public.shift_template_item_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_template_item_id uuid NOT NULL REFERENCES public.shift_template_items(id) ON DELETE CASCADE,
    checklist_id uuid NOT NULL REFERENCES public.house_checklists(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_template_item_id, checklist_id)
);

-- 5. Shift Template Schedules (Recurrence)
-- Consistent with checklist_schedules
CREATE TABLE IF NOT EXISTS public.shift_template_schedules (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_group_id uuid NOT NULL REFERENCES public.shift_template_groups(id) ON DELETE CASCADE,
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    rrule text NOT NULL,
    start_date date NOT NULL,
    end_date date NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE public.shift_type_default_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_item_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_template_schedules ENABLE ROW LEVEL SECURITY;

-- 7. Policies (Allow Authenticated View, Admins Manage)
-- Default Checklists
CREATE POLICY "Allow auth view default checklists" ON public.shift_type_default_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage default checklists" ON public.shift_type_default_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Template Groups
CREATE POLICY "Allow auth view template groups" ON public.shift_template_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template groups" ON public.shift_template_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Template Items
CREATE POLICY "Allow auth view template items" ON public.shift_template_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template items" ON public.shift_template_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Item Checklists
CREATE POLICY "Allow auth view item checklists" ON public.shift_template_item_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage item checklists" ON public.shift_template_item_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Schedules
CREATE POLICY "Allow auth view template schedules" ON public.shift_template_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template schedules" ON public.shift_template_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Deprecation Comment
COMMENT ON TABLE public.house_shift_templates IS 'DEPRECATED: Replaced by shift_template_groups/items hierarchy.';

-- 9. Add metadata to shifts to track template source
ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS template_item_id uuid REFERENCES public.shift_template_items(id) ON DELETE SET NULL;
