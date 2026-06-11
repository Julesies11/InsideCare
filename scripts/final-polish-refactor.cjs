const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const tables = [
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

walkDir('src', (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Fix standard joins that might have been partially prefixed or corrupted
  // Pattern: identifier:table( or identifier:ic_table(
  tables.forEach((table) => {
    // Find cases where it is partially prefixed or eaten
    // e.g. aliasic_table( -> alias:ic_table(
    const regexEat = new RegExp('([a-z_])ic_' + table + '\\(', 'g');
    content = content.replace(regexEat, '$1:ic_' + table + '(');

    // Ensure ic_ prefix is present in joins
    // alias:table( -> alias:ic_table(
    const regexJoin = new RegExp(':' + table + '\\(', 'g');
    content = content.replace(regexJoin, ':ic_' + table + '(');

    // table!inner( -> ic_table!inner(
    const regexHint = new RegExp('\\b' + table + '!', 'g');
    content = content.replace(regexHint, 'ic_' + table + '!');

    // table( -> ic_table( (if preceded by space, comma or start of string)
    const regexDirect = new RegExp('([\\s,\\(\'"])' + table + '\\(', 'g');
    content = content.replace(regexDirect, '$1ic_' + table + '(');
  });

  // 2. Fix filters
  // .eq('table.col', val) -> .eq('ic_table.col', val)
  tables.forEach((table) => {
    const regexFilter = new RegExp('([\'"])' + table + '\\.', 'g');
    content = content.replace(regexFilter, '$1ic_' + table + '.');

    // Fix the case where the opening quote was swallowed
    const regexSwallowedQuote = new RegExp('\\.eq\\(ic_' + table + '\\.', 'g');
    content = content.replace(regexSwallowedQuote, ".eq('ic_" + table + '.');
  });

  // 3. Fix specific broken strings found in manual audit
  content = content.replace(
    /completed_at\s+ic_house_checklist_submission_items/g,
    'completed_at, ic_house_checklist_submission_items',
  );
  content = content.replace(
    /\.eq\("ic_house_calendar_event_staff\.staff_id', staffId\)/g,
    ".eq('ic_house_calendar_event_staff.staff_id', staffId)",
  );

  // 4. Double prefix protection: ic_ic_table -> ic_table
  content = content.replace(/ic_ic_/g, 'ic_');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Final Polish in:', filePath);
  }
});
