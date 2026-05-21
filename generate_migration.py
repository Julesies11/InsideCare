import json
import re

with open('docs/database_schema/schema_metadata.json') as f:
    schema = json.load(f)[0]

with open('docs/database_schema/current_database_rbac.json') as f:
    rbac = json.load(f)

tables = [t['name'] for t in schema['tables']]
enums = [e['name'] for e in schema['enums']]
functions = [f['name'] for f in schema['functions']]
triggers = schema['triggers']

def prefix_logic(text, prefix='ic_'):
    if not text:
        return text
    
    # We want to replace identifiers, but NOT strings in single quotes
    # unless they are storage bucket IDs (which we handle later).
    # A simple way is to split by single quotes and only process even indices.
    parts = text.split("'")
    for i in range(0, len(parts), 2):
        # Process parts[i]
        t_text = parts[i]
        
        # Prefix functions first (they have parens)
        for f in sorted(functions, key=len, reverse=True):
            t_text = re.sub(r'\b' + re.escape(f) + r'\(', prefix + f + '(', t_text)
            
        # Prefix tables
        for t in sorted(tables, key=len, reverse=True):
            # Use word boundaries and ensure it is not followed by _id
            t_text = re.sub(r'\b' + re.escape(t) + r'\b(?!\s*(_id))', prefix + t, t_text)
            
        # Prefix enums
        for e in enums:
            t_text = re.sub(r'\b' + re.escape(e) + r'\b', prefix + e, t_text)
            
        parts[i] = t_text
        
    return "'".join(parts)

print('BEGIN;')

print('\n-- 1. Rename Enums')
for e in enums:
    print(f'ALTER TYPE public.{e} RENAME TO ic_{e};')

print('\n-- 2. Rename Tables')
for t in tables:
    print(f'ALTER TABLE public.{t} RENAME TO ic_{t};')

print('\n-- 3. Rename Functions')
for f_obj in schema['functions']:
    print(f"ALTER FUNCTION public.{f_obj['name']}({f_obj['args']}) RENAME TO ic_{f_obj['name']};")

print('\n-- 4. Update Function Bodies')
for f_obj in schema['functions']:
    new_name = f'ic_{f_obj["name"]}'
    definition = prefix_logic(f_obj['definition'])
    print(f"CREATE OR REPLACE FUNCTION public.{new_name}({f_obj['args']}) RETURNS {f_obj['returns']} AS $${definition}$$ LANGUAGE plpgsql;")

print('\n-- 5. Update Storage')
buckets = ['branch-documents', 'checklist-attachments', 'house-documents', 'participant-documents', 'participant-photos', 'staff-documents', 'staff-photos']
for b in buckets:
    print(f"UPDATE storage.buckets SET id = 'ic_{b}' WHERE id = '{b}';")
    print(f"UPDATE storage.objects SET bucket_id = 'ic_{b}' WHERE bucket_id = '{b}';")

print('\n-- 6. Drop existing RLS policies')
for p in rbac:
    print(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON {"public.ic_" if p["schemaname"] == "public" else "storage."}{p["tablename"]};')

print('\n-- 7. Recreate RLS policies')
for p in rbac:
    table = p['tablename']
    schema_name = p['schemaname']
    target_table = f'public.ic_{table}' if schema_name == 'public' else f'storage.{table}'
    
    qual = prefix_logic(p['qual'])
    with_check = prefix_logic(p['with_check'])
    
    # Handle bucket names in storage policies (these ARE in quotes)
    if qual:
        for b in buckets:
            qual = qual.replace(f"'{b}'", f"'ic_{b}'")
    if with_check:
        for b in buckets:
            with_check = with_check.replace(f"'{b}'", f"'ic_{b}'")

    sql = f'CREATE POLICY "{p["policyname"]}" ON {target_table} FOR {p["cmd"]} TO {p["roles"].strip("{}")}'
    if qual: sql += f' USING ({qual})'
    if with_check: sql += f' WITH CHECK ({with_check})'
    print(sql + ';')

print('\n-- 8. Recreate Triggers')
for tr in triggers:
    # Update timing for function call
    definition = re.sub(r'\b(' + '|'.join(re.escape(f) for f in functions) + r')\(', r'ic_\1(', tr['definition'])
    print(f'CREATE TRIGGER {tr["name"]} {tr["timing"]} {tr["event"]} ON public.ic_{tr["table"]} FOR EACH ROW {definition};')

print('\nCOMMIT;')
