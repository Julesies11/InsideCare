-- Enable RLS
ALTER TABLE public.house_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to house_checklists"
  ON public.house_checklists FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

CREATE POLICY "Admins have full access to house_checklist_items"
  ON public.house_checklist_items FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Staff can read/write checklists for their assigned houses
CREATE POLICY "Staff can manage checklists for assigned houses"
  ON public.house_checklists FOR ALL
  TO authenticated
  USING (
    house_id IN (
      SELECT hsa.house_id 
      FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    house_id IN (
      SELECT hsa.house_id 
      FROM public.house_staff_assignments hsa 
      JOIN public.staff s ON s.id = hsa.staff_id 
      WHERE s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage items for assigned houses"
  ON public.house_checklist_items FOR ALL
  TO authenticated
  USING (
    checklist_id IN (
      SELECT hc.id 
      FROM public.house_checklists hc
      JOIN public.house_staff_assignments hsa ON hsa.house_id = hc.house_id
      JOIN public.staff s ON s.id = hsa.staff_id
      WHERE s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    checklist_id IN (
      SELECT hc.id 
      FROM public.house_checklists hc
      JOIN public.house_staff_assignments hsa ON hsa.house_id = hc.house_id
      JOIN public.staff s ON s.id = hsa.staff_id
      WHERE s.auth_user_id = auth.uid()
    )
  );
