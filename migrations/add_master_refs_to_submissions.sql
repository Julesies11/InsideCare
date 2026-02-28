-- Add master references to submissions for permanent history
alter table public.house_checklist_submissions
add column master_id uuid null references checklist_master (id) on delete set null;

alter table public.house_checklist_submission_items
add column master_item_id uuid null references checklist_item_master (id) on delete set null;

create index if not exists idx_checklist_submissions_master_id on public.house_checklist_submissions using btree (master_id) TABLESPACE pg_default;
create index if not exists idx_checklist_submission_items_master_item_id on public.house_checklist_submission_items using btree (master_item_id) TABLESPACE pg_default;
