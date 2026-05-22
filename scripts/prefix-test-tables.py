import os
import re

# Mapping of unprefixed table names to ic_ prefixed names
MAPPING = {
    'participants': 'ic_participants',
    'staff': 'ic_staff',
    'houses': 'ic_houses',
    'branches': 'ic_branches',
    'departments': 'ic_departments',
    'roles': 'ic_roles',
    'participant_medications': 'ic_participant_medications',
    'participant_goals': 'ic_participant_goals',
    'participant_goal_progress': 'ic_participant_goal_progress',
    'participant_notes': 'ic_participant_notes',
    'participant_documents': 'ic_participant_documents',
    'participant_contacts': 'ic_participant_contacts',
    'participant_funding': 'ic_participant_funding',
    'participant_hygiene_routines': 'ic_participant_hygiene_routines',
    'participant_restrictive_practices': 'ic_participant_restrictive_practices',
    'house_staff_assignments': 'ic_house_staff_assignments',
    'house_calendar_events': 'ic_house_calendar_events',
    'house_calendar_event_staff': 'ic_house_calendar_event_staff',
    'house_calendar_event_participants': 'ic_house_calendar_event_participants',
    'house_calendar_event_attachments': 'ic_house_calendar_event_attachments',
    'house_checklists': 'ic_house_checklists',
    'house_checklist_items': 'ic_house_checklist_items',
    'house_checklist_submissions': 'ic_house_checklist_submissions',
    'house_checklist_submission_items': 'ic_house_checklist_submission_items',
    'house_checklist_item_attachments': 'ic_house_checklist_item_attachments',
    'house_forms': 'ic_house_forms',
    'house_form_assignments': 'ic_house_form_assignments',
    'house_resources': 'ic_house_resources',
    'house_comms': 'ic_house_comms',
    'house_shift_templates': 'ic_house_shift_templates',
    'house_files': 'ic_house_files',
    'staff_compliance': 'ic_staff_compliance',
    'staff_training': 'ic_staff_training',
    'staff_documents': 'ic_staff_documents',
    'staff_shifts': 'ic_staff_shifts',
    'shift_participants': 'ic_shift_participants',
    'shift_notes': 'ic_shift_notes',
    'shift_assigned_checklists': 'ic_shift_assigned_checklists',
    'shift_template_default_checklists': 'ic_shift_template_default_checklists',
    'timesheets': 'ic_timesheets',
    'leave_requests': 'ic_leave_requests',
    'leave_types': 'ic_leave_types',
    'medications_master': 'ic_medications_master',
    'contact_types_master': 'ic_contact_types_master',
    'checklist_master': 'ic_checklist_master',
    'checklist_item_master': 'ic_checklist_item_master',
    'employment_types_master': 'ic_employment_types_master',
    'house_calendar_event_types_master': 'ic_house_calendar_event_types_master',
    'house_types_master': 'ic_house_types_master',
    'funding_sources_master': 'ic_funding_sources_master',
    'funding_types_master': 'ic_funding_types_master',
    'activity_log': 'ic_activity_log',
    'notifications': 'ic_notifications',
    'error_logs': 'ic_error_logs',
    'role_permissions': 'ic_role_permissions',
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Replace in MSW URLs: rest/v1/table_name
    for old, new in MAPPING.items():
        # Match rest/v1/ followed by the table name, ensuring it's not already prefixed
        # and it's followed by a / or a ` or ' or " or ?
        pattern = re.compile(rf'/rest/v1/(?<!ic_){re.escape(old)}(?=[/`\'"?]|$)')
        content = pattern.sub(f'/rest/v1/{new}', content)

    if content != original_content:
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
                if process_file(file_path):
                    print(f"Updated: {file_path}")
                    count += 1
    
    # Also process global handlers
    if process_file('src/test/mocks/handlers.ts'):
        print("Updated: src/test/mocks/handlers.ts")
        count += 1
        
    print(f"Total files updated: {count}")

if __name__ == '__main__':
    main()
