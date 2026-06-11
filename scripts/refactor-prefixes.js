import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

const tableNames = [
  'activity_log',
  'branch_policies',
  'branches',
  'checklist_item_master',
  'checklist_master',
  'checklist_schedules',
  'contact_types_master',
  'departments',
  'employment_types_master',
  'error_logs',
  'funding_sources_master',
  'funding_types_master',
  'house_calendar_event_attachments',
  'house_calendar_event_participants',
  'house_calendar_event_staff',
  'house_calendar_event_types_master',
  'house_calendar_events',
  'house_checklist_item_attachments',
  'house_checklist_items',
  'house_checklist_submission_items',
  'house_checklist_submissions',
  'house_checklists',
  'house_comms',
  'house_files',
  'house_form_assignments',
  'house_form_submissions',
  'house_forms',
  'house_resources',
  'house_shift_templates',
  'house_staff_assignments',
  'house_types_master',
  'houses',
  'leave_requests',
  'leave_types',
  'medications_master',
  'notifications',
  'participant_contacts',
  'participant_documents',
  'participant_forms',
  'participant_funding',
  'participant_goal_progress',
  'participant_goals',
  'participant_hygiene_routines',
  'participant_medications',
  'participant_notes',
  'participant_restrictive_practices',
  'participants',
  'permission_mappings',
  'positions',
  'provider_participants',
  'providers',
  'role_permissions',
  'roles',
  'service_participants',
  'service_staff',
  'services',
  'shift_assigned_checklists',
  'shift_notes',
  'shift_participants',
  'shift_template_checklists',
  'shift_template_default_checklists',
  'staff',
  'staff_compliance',
  'staff_documents',
  'staff_shifts',
  'staff_training',
  'timesheets',
  'user_roles',
];

const bucketNames = {
  'branch-documents': 'ic_branch_documents',
  'checklist-attachments': 'ic_checklist_attachments',
  'house-documents': 'ic_house_documents',
  'participant-documents': 'ic_participant_documents',
  'participant-photos': 'ic_participant_photos',
  'staff-documents': 'ic_staff_documents',
  'staff-photos': 'ic_staff_photos',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir(srcDir, (filePath) => {
  if (
    !filePath.endsWith('.ts') &&
    !filePath.endsWith('.tsx') &&
    !filePath.endsWith('.js')
  )
    return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace table names in .from('...')
  tableNames.forEach((table) => {
    const regex = new RegExp(`\\.from\\(['"]${table}['"]\\)`, 'g');
    content = content.replace(regex, `.from('ic_${table}')`);
  });

  // Replace bucket names in .storage.from('...')
  Object.keys(bucketNames).forEach((bucket) => {
    const regex = new RegExp(`\\.storage\\.from\\(['"]${bucket}['"]\\)`, 'g');
    content = content.replace(regex, `.storage.from('${bucketNames[bucket]}')`);

    // Also handle just .from('bucket') if it's following a storage call in a chain
    // (though less common, better safe)
    const regex2 = new RegExp(`storage\\.from\\(['"]${bucket}['"]\\)`, 'g');
    content = content.replace(regex2, `storage.from('${bucketNames[bucket]}')`);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});
