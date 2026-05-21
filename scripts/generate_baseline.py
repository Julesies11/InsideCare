import json
import os

# Load schema metadata
schema_path = 'docs/database_schema/schema_metadata.json'
rbac_path = 'docs/database_schema/current_database_rbac.json'

if not os.path.exists(schema_path):
    print(f"Error: {schema_path} not found.")
    exit(1)

with open(schema_path) as f:
    schema_list = json.load(f)
    schema = schema_list[0]

with open(rbac_path) as f:
    rbac = json.load(f)

sql = ["-- InsideCare Baseline Migration", "-- Generated from docs/database_schema", "BEGIN;"]

# 1. Extensions
sql.append("\n-- 0. Extensions")
sql.append("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
sql.append("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";")

# 2. Enums
sql.append("\n-- 1. Enums")
for e in schema.get('enums', []):
    vals = ", ".join(f"'{v}'" for v in e['values'])
    sql.append(f"DROP TYPE IF EXISTS public.{e['name']} CASCADE;")
    sql.append(f"CREATE TYPE public.{e['name']} AS ENUM ({vals});")

# 3. Tables
sql.append("\n-- 2. Tables")
for t in schema['tables']:
    sql.append(f"DROP TABLE IF EXISTS public.{t['name']} CASCADE;")
    cols = []
    for c in t['columns']:
        col_type = c['type']
        if col_type == 'ARRAY':
            col_type = 'text[]'
        elif col_type == 'USER-DEFINED' and c.get('default'):
            import re
            m = re.search(r'::(\w+)', c['default'])
            if m:
                col_type = m.group(1)
        col_def = f"{c['name']} {col_type}"
        if c.get('nullable') == 'NO':
            col_def += " NOT NULL"
        if c.get('default'):
            # Handle default value escaping if necessary, but metadata should be clean
            col_def += f" DEFAULT {c['default']}"
        cols.append(col_def)
    
    # Primary Keys
    pks = [c['name'] for c in t['columns'] if c.get('pk')]
    if pks:
        cols.append(f"PRIMARY KEY ({', '.join(pks)})")
    
    # Add manual unique constraints for critical tables
    if t['name'] == 'ic_role_permissions':
        cols.append("UNIQUE (role_id)")
    elif t['name'] == 'ic_staff':
        cols.append("UNIQUE (email)")
        cols.append("UNIQUE (auth_user_id)")
        
    sql.append(f"CREATE TABLE public.{t['name']} (\n    " + ",\n    ".join(cols) + "\n);")
    if t.get('rls_enabled'):
        sql.append(f"ALTER TABLE public.{t['name']} ENABLE ROW LEVEL SECURITY;")

# 4. Foreign Keys
sql.append("\n-- 3. Foreign Keys")
for t in schema['tables']:
    for fk in t.get('foreign_keys', []):
        # Strip ic_ prefix for constraint name to match frontend hints
        simple_table = t['name'].replace('ic_', '')
        constraint_name = f"{simple_table}_{fk['col']}_fkey"
        sql.append(f"ALTER TABLE public.{t['name']} ADD CONSTRAINT {constraint_name} FOREIGN KEY ({fk['col']}) REFERENCES public.{fk['ref_table']}({fk['ref_col']});")

# 5. Postgres Functions
sql.append("\n-- 4. Postgres Functions")
for f_obj in schema.get('functions', []):
    # Ensure function body uses ic_ prefixes
    definition = f_obj['definition']
    security = ""
    if 'auth.users' in definition:
        security = " SECURITY DEFINER"
    sql.append(f"CREATE OR REPLACE FUNCTION public.{f_obj['name']}({f_obj['args']}) RETURNS {f_obj['returns']} AS $${definition}$$ LANGUAGE plpgsql{security};")

# 6. Storage Buckets
sql.append("\n-- 5. Storage Buckets")
# ALIGNED WITH FRONTEND: Using underscores
buckets = ['ic_branch_documents', 'ic_checklist_attachments', 'ic_house_documents', 'ic_participant_documents', 'ic_participant_photos', 'ic_staff_documents', 'ic_staff_photos']
for b in buckets:
    # Supabase storage bucket creation via SQL
    sql.append(f"INSERT INTO storage.buckets (id, name, public) VALUES ('{b}', '{b}', false) ON CONFLICT DO NOTHING;")

# 7. RLS Policies
sql.append("\n-- 6. RLS Policies")
for p in rbac:
    table = p['tablename']
    schema_name = p['schemaname']
    target_table = f"{schema_name}.{table}"
    
    qual = p.get('qual')
    with_check = p.get('with_check')
    
    # FIX: Replace hyphens with underscores in bucket_id checks within policies
    if qual:
        qual = qual.replace('ic_branch-documents', 'ic_branch_documents') \
                   .replace('ic_checklist-attachments', 'ic_checklist_attachments') \
                   .replace('ic_house-documents', 'ic_house_documents') \
                   .replace('ic_participant-documents', 'ic_participant_documents') \
                   .replace('ic_participant-photos', 'ic_participant_photos') \
                   .replace('ic_staff-documents', 'ic_staff_documents') \
                   .replace('ic_staff-photos', 'ic_staff_photos')
    if with_check:
        with_check = with_check.replace('ic_branch-documents', 'ic_branch_documents') \
                               .replace('ic_checklist-attachments', 'ic_checklist_attachments') \
                               .replace('ic_house-documents', 'ic_house_documents') \
                               .replace('ic_participant-documents', 'ic_participant_documents') \
                               .replace('ic_participant-photos', 'ic_participant_photos') \
                               .replace('ic_staff-documents', 'ic_staff_documents') \
                               .replace('ic_staff-photos', 'ic_staff_photos')
    
    # Construct policy
    sql.append(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON {target_table};')
    pol_sql = f'CREATE POLICY "{p["policyname"]}" ON {target_table} FOR {p["cmd"]} TO {p["roles"].strip("{}")}'
    if qual:
        pol_sql += f" USING ({qual})"
    if with_check:
        pol_sql += f" WITH CHECK ({with_check})"
    sql.append(pol_sql + ";")

# 8. Triggers
sql.append("\n-- 7. Triggers")
for tr in schema.get('triggers', []):
    sql.append(f"DROP TRIGGER IF EXISTS {tr['name']} ON public.{tr['table']};")
    sql.append(f"CREATE TRIGGER {tr['name']} {tr['timing']} {tr['event']} ON public.{tr['table']} FOR EACH ROW {tr['definition']};")

sql.append("\nCOMMIT;")

output_file = 'migrations/2026052110_baseline_dev_schema.sql'
with open(output_file, 'w') as f:
    f.write("\n".join(sql))

print(f"Successfully generated {output_file}")
