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

walkDir('src', (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix 1: Filter using table name instead of alias
  // Target: .select('staff_assignments:ic_house_calendar_event_staff!inner(...)').eq('ic_house_calendar_event_staff.staff_id', ...)
  // Change to: .eq('staff_assignments.staff_id', ...)

  const patterns = [
    { alias: 'staff_assignments', table: 'ic_house_calendar_event_staff' },
    { alias: 'house', table: 'ic_houses' },
    { alias: 'participants', table: 'ic_shift_participants' },
    { alias: 'submissions', table: 'ic_house_checklist_submissions' },
    { alias: 'items', table: 'ic_house_checklist_items' },
    { alias: 'department_info', table: 'ic_departments' },
    { alias: 'employment_type_info', table: 'ic_employment_types_master' },
    { alias: 'role', table: 'ic_roles' },
  ];

  patterns.forEach((p) => {
    const regex = new RegExp('\\.eq\\([\'"]' + p.table + '\\.', 'g');
    content = content.replace(regex, ".eq('" + p.alias + '.');
  });

  // Fix 2: Check for any .select strings that are MISSING the ic_ prefix on joined tables
  const tables = [
    'house_calendar_event_staff',
    'house_checklist_submission_items',
    'shift_participants',
  ];
  tables.forEach((table) => {
    // If it is NOT preceded by 'ic_', prefix it.
    // Negative lookbehind (?<!ic_) is safer.
    const regex = new RegExp('(?<!ic_)' + table + '\\b', 'g');
    content = content.replace(regex, 'ic_' + table);
  });

  // Fix 3: Standardize quotes and spacing in .select strings
  content = content.replace(/ic_ic_/g, 'ic_');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Consistency fix in:', filePath);
  }
});
