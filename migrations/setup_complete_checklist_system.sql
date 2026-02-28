-- ============================================================
-- 1. MASTER TABLES (Blueprints)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.checklist_master (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  name text NOT NULL,
  frequency text NOT NULL,
  description text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT checklist_master_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.checklist_item_master (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  master_id uuid NOT NULL,
  title text NOT NULL,
  instructions text NULL,
  priority text NULL DEFAULT 'medium'::text,
  is_required boolean NULL DEFAULT true,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT checklist_item_master_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_item_master_master_id_fkey FOREIGN KEY (master_id) REFERENCES checklist_master (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================================
-- 2. HOUSE CHECKLIST TABLES (Instances)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.house_checklists (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  house_id uuid NULL,
  master_id uuid NULL,
  name text NOT NULL,
  frequency text NOT NULL,
  description text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklists_pkey PRIMARY KEY (id),
  CONSTRAINT house_checklists_house_id_fkey FOREIGN KEY (house_id) REFERENCES houses (id) ON DELETE CASCADE,
  CONSTRAINT house_checklists_master_id_fkey FOREIGN KEY (master_id) REFERENCES checklist_master (id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.house_checklist_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  checklist_id uuid NOT NULL,
  master_item_id uuid NULL,
  title text NOT NULL,
  instructions text NULL,
  priority text NULL DEFAULT 'medium'::text,
  is_required boolean NULL DEFAULT true,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklist_items_pkey PRIMARY KEY (id),
  CONSTRAINT house_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES house_checklists (id) ON DELETE CASCADE,
  CONSTRAINT house_checklist_items_master_item_id_fkey FOREIGN KEY (master_item_id) REFERENCES checklist_item_master (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- ============================================================
-- 3. SUBMISSION & ACTIVITY TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.house_checklist_submissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  checklist_id uuid NOT NULL,
  house_id uuid NOT NULL,
  master_id uuid NULL,
  submitted_by uuid NULL,
  status text NOT NULL DEFAULT 'in_progress'::text,
  started_at timestamp with time zone NULL DEFAULT now(),
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklist_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT house_checklist_submissions_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES house_checklists (id) ON DELETE CASCADE,
  CONSTRAINT house_checklist_submissions_house_id_fkey FOREIGN KEY (house_id) REFERENCES houses (id) ON DELETE CASCADE,
  CONSTRAINT house_checklist_submissions_master_id_fkey FOREIGN KEY (master_id) REFERENCES checklist_master (id) ON DELETE SET NULL,
  CONSTRAINT house_checklist_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES staff (id) ON DELETE SET NULL,
  CONSTRAINT status_check CHECK (status IN ('in_progress', 'completed'))
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.house_checklist_submission_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  submission_id uuid NOT NULL,
  item_id uuid NOT NULL,
  master_item_id uuid NULL,
  is_completed boolean NOT NULL DEFAULT false,
  note text NULL,
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklist_submission_items_pkey PRIMARY KEY (id),
  CONSTRAINT house_checklist_submission_items_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES house_checklist_submissions (id) ON DELETE CASCADE,
  CONSTRAINT house_checklist_submission_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES house_checklist_items (id) ON DELETE CASCADE,
  CONSTRAINT house_checklist_submission_items_master_item_id_fkey FOREIGN KEY (master_item_id) REFERENCES checklist_item_master (id) ON DELETE SET NULL,
  CONSTRAINT submission_item_unique UNIQUE (submission_id, item_id)
) TABLESPACE pg_default;

-- ============================================================
-- 4. ATTACHMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.house_checklist_item_attachments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  submission_id uuid NOT NULL,
  item_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NULL,
  mime_type text NULL,
  uploaded_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT house_checklist_item_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT house_checklist_item_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES house_checklist_submissions (id) ON DELETE CASCADE,
  CONSTRAINT house_checklist_item_attachments_item_id_fkey FOREIGN KEY (item_id) REFERENCES house_checklist_items (id) ON DELETE CASCADE,
  CONSTRAINT house_checklist_item_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES staff (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- ============================================================
-- 5. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-attachments', 'checklist-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. INDICES & TRIGGERS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_checklist_master_name ON public.checklist_master (name);
CREATE INDEX IF NOT EXISTS idx_checklist_item_master_id ON public.checklist_item_master (master_id);
CREATE INDEX IF NOT EXISTS idx_house_checklists_house_id ON public.house_checklists (house_id);
CREATE INDEX IF NOT EXISTS idx_house_checklists_master_id ON public.house_checklists (master_id);
CREATE INDEX IF NOT EXISTS idx_checklist_submissions_house_id ON public.house_checklist_submissions (house_id);
CREATE INDEX IF NOT EXISTS idx_checklist_submission_items_submission_id ON public.house_checklist_submission_items (submission_id);

-- Triggers for updated_at (with DROP IF EXISTS for idempotency)
DROP TRIGGER IF EXISTS update_checklist_master_updated_at ON public.checklist_master;
CREATE TRIGGER update_checklist_master_updated_at BEFORE UPDATE ON checklist_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklist_item_master_updated_at ON public.checklist_item_master;
CREATE TRIGGER update_checklist_item_master_updated_at BEFORE UPDATE ON checklist_item_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_house_checklists_updated_at ON public.house_checklists;
CREATE TRIGGER update_house_checklists_updated_at BEFORE UPDATE ON house_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_house_checklist_items_updated_at ON public.house_checklist_items;
CREATE TRIGGER update_house_checklist_items_updated_at BEFORE UPDATE ON house_checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_house_checklist_submissions_updated_at ON public.house_checklist_submissions;
CREATE TRIGGER update_house_checklist_submissions_updated_at BEFORE UPDATE ON house_checklist_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_house_checklist_submission_items_updated_at ON public.house_checklist_submission_items;
CREATE TRIGGER update_house_checklist_submission_items_updated_at BEFORE UPDATE ON house_checklist_submission_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_house_checklist_item_attachments_updated_at ON public.house_checklist_item_attachments;
CREATE TRIGGER update_house_checklist_item_attachments_updated_at BEFORE UPDATE ON house_checklist_item_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. RLS POLICIES (Security)
-- ============================================================

-- Enable RLS
ALTER TABLE public.checklist_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_checklist_item_attachments ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES (Full Access)
DO $$ 
BEGIN
    -- Checklist Master
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access' AND tablename = 'checklist_master') THEN
        CREATE POLICY "Admins full access" ON public.checklist_master FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access' AND tablename = 'checklist_item_master') THEN
        CREATE POLICY "Admins full access" ON public.checklist_item_master FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access' AND tablename = 'house_checklists') THEN
        CREATE POLICY "Admins full access" ON public.house_checklists FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access' AND tablename = 'house_checklist_items') THEN
        CREATE POLICY "Admins full access" ON public.house_checklist_items FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access' AND tablename = 'house_checklist_submissions') THEN
        CREATE POLICY "Admins full access" ON public.house_checklist_submissions FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access' AND tablename = 'house_checklist_submission_items') THEN
        CREATE POLICY "Admins full access" ON public.house_checklist_submission_items FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access' AND tablename = 'house_checklist_item_attachments') THEN
        CREATE POLICY "Admins full access" ON public.house_checklist_item_attachments FOR ALL TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
    END IF;
END $$;

-- STAFF POLICIES (Assigned House Only)
DO $$ 
BEGIN
    -- Read Access to Masters (so they can clone)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff read masters' AND tablename = 'checklist_master') THEN
        CREATE POLICY "Staff read masters" ON public.checklist_master FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff read masters' AND tablename = 'checklist_item_master') THEN
        CREATE POLICY "Staff read masters" ON public.checklist_item_master FOR SELECT TO authenticated USING (true);
    END IF;

    -- Checklist Config
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff manage assigned checklists' AND tablename = 'house_checklists') THEN
        CREATE POLICY "Staff manage assigned checklists" ON public.house_checklists FOR ALL TO authenticated USING (house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff manage assigned checklist items' AND tablename = 'house_checklist_items') THEN
        CREATE POLICY "Staff manage assigned checklist items" ON public.house_checklist_items FOR ALL TO authenticated USING (checklist_id IN (SELECT id FROM house_checklists WHERE house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));
    END IF;

    -- Checklist Submissions (Assigned house only)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff manage assigned submissions' AND tablename = 'house_checklist_submissions') THEN
        CREATE POLICY "Staff manage assigned submissions" ON public.house_checklist_submissions FOR ALL TO authenticated USING (house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));
    END IF;
    
    -- Submission Items & Attachments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff manage assigned submission items' AND tablename = 'house_checklist_submission_items') THEN
        CREATE POLICY "Staff manage assigned submission items" ON public.house_checklist_submission_items FOR ALL TO authenticated USING (submission_id IN (SELECT id FROM house_checklist_submissions WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff manage assigned attachments' AND tablename = 'house_checklist_item_attachments') THEN
        CREATE POLICY "Staff manage assigned attachments" ON public.house_checklist_item_attachments FOR ALL TO authenticated USING (submission_id IN (SELECT id FROM house_checklist_submissions WHERE house_id IN (SELECT house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid())));
    END IF;
END $$;

-- STORAGE POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'checklist-attachments');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'checklist-attachments');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manage Own' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Manage Own" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'checklist-attachments');
    END IF;
END $$;
