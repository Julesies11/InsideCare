-- Create house_checklist_item_attachments table
create table public.house_checklist_item_attachments (
  id uuid not null default extensions.uuid_generate_v4 (),
  submission_id uuid not null,
  item_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_size bigint null,
  mime_type text null,
  uploaded_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint house_checklist_item_attachments_pkey primary key (id),
  constraint house_checklist_item_attachments_submission_id_fkey foreign KEY (submission_id) references house_checklist_submissions (id) on delete CASCADE,
  constraint house_checklist_item_attachments_item_id_fkey foreign KEY (item_id) references house_checklist_items (id) on delete CASCADE,
  constraint house_checklist_item_attachments_uploaded_by_fkey foreign KEY (uploaded_by) references staff (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_checklist_item_attachments_submission_id on public.house_checklist_item_attachments using btree (submission_id) TABLESPACE pg_default;
create index IF not exists idx_checklist_item_attachments_item_id on public.house_checklist_item_attachments using btree (item_id) TABLESPACE pg_default;

-- Add triggers for updated_at
create trigger update_house_checklist_item_attachments_updated_at BEFORE
update on house_checklist_item_attachments for EACH row
execute FUNCTION update_updated_at_column ();

-- ============================================================
-- RLS POLICIES FOR DATABASE TABLE
-- ============================================================

ALTER TABLE public.house_checklist_item_attachments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to house_checklist_item_attachments"
  ON public.house_checklist_item_attachments FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Staff can manage attachments for their assigned houses
CREATE POLICY "Staff can manage checklist item attachments for assigned houses"
  ON public.house_checklist_item_attachments FOR ALL
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

-- ============================================================
-- STORAGE BUCKET SETUP
-- ============================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-attachments', 'checklist-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 1. Allow Public Access to read files
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'checklist-attachments' );

-- 2. Allow Authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'checklist-attachments' );

-- 3. Allow Authenticated users to update/delete their own uploads
CREATE POLICY "Authenticated users can manage own objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING ( bucket_id = 'checklist-attachments' );
