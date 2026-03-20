-- Create house_checklist_submissions table
create table public.house_checklist_submissions (
  id uuid not null default extensions.uuid_generate_v4 (),
  checklist_id uuid not null,
  house_id uuid not null,
  submitted_by uuid null,
  status text not null default 'in_progress'::text,
  started_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_checklist_submissions_pkey primary key (id),
  constraint house_checklist_submissions_checklist_id_fkey foreign KEY (checklist_id) references house_checklists (id) on delete CASCADE,
  constraint house_checklist_submissions_house_id_fkey foreign KEY (house_id) references houses (id) on delete CASCADE,
  constraint house_checklist_submissions_submitted_by_fkey foreign KEY (submitted_by) references staff (id) on delete set null,
  constraint status_check check (
    (
      status = any (
        array[
          'in_progress'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_checklist_submissions_checklist_id on public.house_checklist_submissions using btree (checklist_id) TABLESPACE pg_default;
create index IF not exists idx_checklist_submissions_house_id on public.house_checklist_submissions using btree (house_id) TABLESPACE pg_default;
create index IF not exists idx_checklist_submissions_status on public.house_checklist_submissions using btree (status) TABLESPACE pg_default;

-- Create house_checklist_submission_items table
create table public.house_checklist_submission_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  submission_id uuid not null,
  item_id uuid not null,
  is_completed boolean not null default false,
  note text null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_checklist_submission_items_pkey primary key (id),
  constraint house_checklist_submission_items_submission_id_fkey foreign KEY (submission_id) references house_checklist_submissions (id) on delete CASCADE,
  constraint house_checklist_submission_items_item_id_fkey foreign KEY (item_id) references house_checklist_items (id) on delete CASCADE,
  constraint submission_item_unique unique (submission_id, item_id)
) TABLESPACE pg_default;

create index IF not exists idx_checklist_submission_items_submission_id on public.house_checklist_submission_items using btree (submission_id) TABLESPACE pg_default;

-- Add triggers for updated_at
create trigger update_house_checklist_submissions_updated_at BEFORE
update on house_checklist_submissions for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_house_checklist_submission_items_updated_at BEFORE
update on house_checklist_submission_items for EACH row
execute FUNCTION update_updated_at_column ();

-- ============================================================
-- RLS POLICIES for Checklist Submissions
-- ============================================================

ALTER TABLE public.house_checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_submission_items ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to house_checklist_submissions"
  ON public.house_checklist_submissions FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

CREATE POLICY "Admins have full access to house_checklist_submission_items"
  ON public.house_checklist_submission_items FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Staff can read/write submissions for their assigned houses
CREATE POLICY "Staff can manage checklist submissions for assigned houses"
  ON public.house_checklist_submissions FOR ALL
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

CREATE POLICY "Staff can manage checklist submission items for assigned houses"
  ON public.house_checklist_submission_items FOR ALL
  TO authenticated
  USING (
    submission_id IN (
      SELECT hcs.id 
      FROM public.house_checklist_submissions hcs
      JOIN public.house_staff_assignments hsa ON hsa.house_id = hcs.house_id
      JOIN public.staff s ON s.id = hsa.staff_id
      WHERE s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    submission_id IN (
      SELECT hcs.id 
      FROM public.house_checklist_submissions hcs
      JOIN public.house_staff_assignments hsa ON hsa.house_id = hcs.house_id
      JOIN public.staff s ON s.id = hsa.staff_id
      WHERE s.auth_user_id = auth.uid()
    )
  );
