
-- Migration: Link Participants to Shift Template Items
-- Date: 2026-03-29
-- Description: Adds a mapping table to link participants directly to shift template items, ensuring they are automatically assigned when a template is materialized.

CREATE TABLE IF NOT EXISTS public.shift_template_item_participants (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_template_item_id uuid NOT NULL REFERENCES public.shift_template_items(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_template_item_id, participant_id)
);

ALTER TABLE public.shift_template_item_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow auth view template item participants" ON public.shift_template_item_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage template item participants" ON public.shift_template_item_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
