-- Add master_item_id to house_checklist_items to track source template item
alter table public.house_checklist_items
add column master_item_id uuid null references checklist_item_master (id) on delete set null;

create index if not exists idx_house_checklist_items_master_item_id on public.house_checklist_items using btree (master_item_id) TABLESPACE pg_default;
