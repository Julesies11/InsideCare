import os
import re

# Mapping of prefixed table names to TABLES constant keys
TABLE_TO_CONSTANT = {
    'ic_participants': 'PARTICIPANTS',
    'ic_staff': 'STAFF',
    'ic_houses': 'HOUSES',
    'ic_branches': 'BRANCHES',
    'ic_departments': 'DEPARTMENTS',
    'ic_roles': 'ROLES',
    'ic_participant_medications': 'PARTICIPANT_MEDICATIONS',
    'ic_participant_goals': 'PARTICIPANT_GOALS',
    'ic_participant_goal_progress': 'PARTICIPANT_GOAL_PROGRESS',
    'ic_participant_notes': 'PARTICIPANT_NOTES',
    'ic_participant_documents': 'PARTICIPANT_DOCUMENTS',
    'ic_participant_contacts': 'PARTICIPANT_CONTACTS',
    'ic_participant_funding': 'PARTICIPANT_FUNDING',
    'ic_participant_hygiene_routines': 'PARTICIPANT_HYGIENE_ROUTINES',
    'ic_participant_restrictive_practices': 'PARTICIPANT_RESTRICTIVE_PRACTICES',
    'ic_house_staff_assignments': 'HOUSE_STAFF_ASSIGNMENTS',
    'ic_house_calendar_events': 'HOUSE_CALENDAR_EVENTS',
    'ic_house_calendar_event_staff': 'HOUSE_CALENDAR_EVENT_STAFF',
    'ic_house_calendar_event_participants': 'HOUSE_CALENDAR_EVENT_PARTICIPANTS',
    'ic_house_calendar_event_attachments': 'HOUSE_CALENDAR_EVENT_ATTACHMENTS',
    'ic_house_checklists': 'HOUSE_CHECKLISTS',
    'ic_house_checklist_items': 'HOUSE_CHECKLIST_ITEMS',
    'ic_house_checklist_submissions': 'HOUSE_CHECKLIST_SUBMISSIONS',
    'ic_house_checklist_submission_items': 'HOUSE_CHECKLIST_SUBMISSION_ITEMS',
    'ic_house_checklist_item_attachments': 'HOUSE_CHECKLIST_ITEM_ATTACHMENTS',
    'ic_house_forms': 'HOUSE_FORMS',
    'ic_house_form_assignments': 'HOUSE_FORM_ASSIGNMENTS',
    'ic_house_resources': 'HOUSE_RESOURCES',
    'ic_house_comms': 'HOUSE_COMMS',
    'ic_house_shift_templates': 'HOUSE_SHIFT_TEMPLATES',
    'ic_house_files': 'HOUSE_FILES',
    'ic_staff_compliance': 'STAFF_COMPLIANCE',
    'ic_staff_training': 'STAFF_TRAINING',
    'ic_staff_documents': 'STAFF_DOCUMENTS',
    'ic_staff_shifts': 'STAFF_SHIFTS',
    'ic_shift_participants': 'SHIFT_PARTICIPANTS',
    'ic_shift_notes': 'SHIFT_NOTES',
    'ic_shift_assigned_checklists': 'SHIFT_ASSIGNED_CHECKLISTS',
    'ic_shift_template_default_checklists': 'SHIFT_TEMPLATE_DEFAULT_CHECKLISTS',
    'ic_timesheets': 'TIMESHEETS',
    'ic_leave_requests': 'LEAVE_REQUESTS',
    'ic_leave_types': 'LEAVE_TYPES',
    'ic_medications_master': 'MEDICATIONS_MASTER',
    'ic_contact_types_master': 'CONTACT_TYPES_MASTER',
    'ic_checklist_master': 'CHECKLIST_MASTER',
    'ic_checklist_item_master': 'CHECKLIST_ITEM_MASTER',
    'ic_employment_types_master': 'EMPLOYMENT_TYPES_MASTER',
    'ic_house_calendar_event_types_master': 'HOUSE_CALENDAR_EVENT_TYPES_MASTER',
    'ic_house_types_master': 'HOUSE_TYPES_MASTER',
    'ic_funding_sources_master': 'FUNDING_SOURCES_MASTER',
    'ic_funding_types_master': 'FUNDING_TYPES_MASTER',
    'ic_activity_log': 'ACTIVITY_LOG',
    'ic_notifications': 'NOTIFICATIONS',
    'ic_error_logs': 'ERROR_LOGS',
    'ic_role_permissions': 'ROLE_PERMISSIONS',
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # 1. Replace in MSW URLs: rest/v1/ic_table_name
    for table, const in TABLE_TO_CONSTANT.items():
        # Match rest/v1/ followed by the table name
        pattern = re.compile(rf'/rest/v1/{re.escape(table)}(?=[/`\'"?]|$)')
        if pattern.search(content):
            content = pattern.sub(f'/rest/v1/${{TABLES.{const}}}', content)
            modified = True

    # 2. Replace in supabase.from('ic_table_name') or toHaveBeenCalledWith('ic_table_name')
    for table, const in TABLE_TO_CONSTANT.items():
        # Match ('ic_table_name') or ("ic_table_name")
        pattern = re.compile(rf'([(\s,])[\'"]{re.escape(table)}[\'"]([)\s,])')
        if pattern.search(content):
            content = pattern.sub(rf'\1TABLES.{const}\2', content)
            modified = True

    if modified:
        # 3. Add import if not present
        if 'import { TABLES } from' not in content:
            # Find the best place to insert the import
            # Prefer after other @/ imports
            import_match = re.search(r'import .* from \'@/.*\';', content)
            if import_match:
                content = content[:import_match.end()] + f"\nimport {{ TABLES }} from '@/config/db-tables';" + content[import_match.end():]
            else:
                # Otherwise, at the top after other imports
                last_import = list(re.finditer(r'^import .*;$', content, re.MULTILINE))
                if last_import:
                    content = content[:last_import[-1].end()] + f"\nimport {{ TABLES }} from '@/config/db-tables';" + content[last_import[-1].end():]
                else:
                    content = f"import {{ TABLES }} from '@/config/db-tables';\n" + content

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    root_dir = 'src'
    count = 0
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.test.ts') or file.endswith('.test.tsx'):
                file_path = os.path.join(root, file)
                # Skip global handlers as we already did it
                if 'src/test/mocks/handlers.ts' in file_path:
                    continue
                if process_file(file_path):
                    print(f"Refactored: {file_path}")
                    count += 1
    
    print(f"Total files refactored to use constants: {count}")

if __name__ == '__main__':
    main()
