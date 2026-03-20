-- Create checklist_master table
create table public.checklist_master (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  frequency text not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint checklist_master_pkey primary key (id)
) TABLESPACE pg_default;

-- Create checklist_item_master table
create table public.checklist_item_master (
  id uuid not null default extensions.uuid_generate_v4 (),
  master_id uuid not null,
  title text not null,
  instructions text null,
  priority text null default 'medium'::text,
  is_required boolean null default true,
  sort_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint checklist_item_master_pkey primary key (id),
  constraint checklist_item_master_master_id_fkey foreign KEY (master_id) references checklist_master (id) on delete CASCADE
) TABLESPACE pg_default;

-- Modify house_checklists table
alter table public.house_checklists 
add column master_id uuid null references checklist_master (id) on delete set null;

alter table public.house_checklists
drop column if exists is_global;

-- Add indices
create index if not exists idx_checklist_master_name on public.checklist_master using btree (name) TABLESPACE pg_default;
create index if not exists idx_checklist_item_master_id on public.checklist_item_master using btree (master_id) TABLESPACE pg_default;
create index if not exists idx_house_checklists_master_id on public.house_checklists using btree (master_id) TABLESPACE pg_default;

-- Add triggers for updated_at
create trigger update_checklist_master_updated_at BEFORE
update on checklist_master for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_checklist_item_master_updated_at BEFORE
update on checklist_item_master for EACH row
execute FUNCTION update_updated_at_column ();

-- ============================================================
-- RLS POLICIES for Master Checklists
-- ============================================================

ALTER TABLE public.checklist_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_master ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to checklist_master"
  ON public.checklist_master FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

CREATE POLICY "Admins have full access to checklist_item_master"
  ON public.checklist_item_master FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- All authenticated users can read templates
CREATE POLICY "Authenticated users can read checklist_master"
  ON public.checklist_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read checklist_item_master"
  ON public.checklist_item_master FOR SELECT
  TO authenticated
  USING (true);
