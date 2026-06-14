import { TemplateTag } from './types';

/**
 * Definitions and mapping for Staff Template Tags.
 */
export const STAFF_TEMPLATE_TAGS: TemplateTag[] = [
  // Personal Details
  { name: '{{staff_name}}', description: "Staff member's full name", category: 'Personal Details', example: 'Jane Smith' },
  { name: '{{email}}', description: 'Work email address', category: 'Personal Details', example: 'jane.smith@insidecare.com' },
  { name: '{{phone}}', description: 'Contact phone number', category: 'Personal Details', example: '0411 111 111' },
  { name: '{{address}}', description: 'Residential address', category: 'Personal Details', example: '456 Oak St, Melbourne' },
  { name: '{{date_of_birth}}', description: 'Date of birth', category: 'Personal Details', example: '20/10/1985' },
  { name: '{{allergies}}', description: 'Known allergies', category: 'Personal Details', example: 'None' },
  { name: '{{hobbies}}', description: 'Hobbies and interests', category: 'Personal Details', example: 'Reading, Gardening' },
  { name: '{{notes}}', description: 'General staff notes/details', category: 'Personal Details', example: 'Experienced with high needs' },

  // Employment Details
  { name: '{{status}}', description: 'Employment status (active, inactive, etc.)', category: 'Employment Details', example: 'active' },
  { name: '{{hire_date}}', description: 'Date of hire', category: 'Employment Details', example: '01/01/2024' },
  { name: '{{separation_date}}', description: 'Date of separation (if applicable)', category: 'Employment Details', example: '-' },
  { name: '{{role}}', description: 'Job role/title', category: 'Employment Details', example: 'Support Worker' },
  { name: '{{manager_name}}', description: "Manager's full name", category: 'Employment Details', example: 'Robert Brown' },
  { name: '{{department}}', description: 'Department name', category: 'Employment Details', example: 'Care Services' },
  { name: '{{employment_type}}', description: 'Employment type', category: 'Employment Details', example: 'Full-time' },

  // Emergency Contact & Availability
  { name: '{{emergency_contact_name}}', description: 'Emergency contact name', category: 'Emergency Contact', example: 'Michael Smith' },
  { name: '{{emergency_contact_phone}}', description: 'Emergency contact phone', category: 'Emergency Contact', example: '0422 222 222' },
  { name: '{{availability}}', description: 'General availability notes', category: 'Availability', example: 'Weekdays only' },

  // Qualifications Loop (grouped under Qualifications)
  { name: '{{#qualifications}}', description: 'Start of qualifications loop', category: 'Qualifications', example: '{{#qualifications}}', isLoopStart: true },
  { name: '{{title}}', description: 'Qualification title (inside loop)', category: 'Qualifications', example: 'First Aid Certificate', loopParent: '{{#qualifications}}' },
  { name: '{{institution}}', description: 'Institution name (inside loop)', category: 'Qualifications', example: 'Red Cross', loopParent: '{{#qualifications}}' },
  { name: '{{date_completed}}', description: 'Completion date (inside loop)', category: 'Qualifications', example: '15/05/2025', loopParent: '{{#qualifications}}' },
  { name: '{{expiry_date}}', description: 'Expiry date (inside loop)', category: 'Qualifications', example: '15/05/2028', loopParent: '{{#qualifications}}' },
  { name: '{{file_name}}', description: 'Evidence file name (inside loop)', category: 'Qualifications', example: 'cert.pdf', loopParent: '{{#qualifications}}' },
  { name: '{{/qualifications}}', description: 'End of qualifications loop', category: 'Qualifications', example: '{{/qualifications}}', isLoopEnd: true },

  // Training Loop (grouped under Training)
  { name: '{{#training}}', description: 'Start of training loop', category: 'Training', example: '{{#training}}', isLoopStart: true },
  { name: '{{title}}', description: 'Training title (inside loop)', category: 'Training', example: 'Ndis Induction', loopParent: '{{#training}}' },
  { name: '{{category}}', description: 'Training category (inside loop)', category: 'Training', example: 'Induction', loopParent: '{{#training}}' },
  { name: '{{description}}', description: 'Training description (inside loop)', category: 'Training', example: 'Overview of standard policies', loopParent: '{{#training}}' },
  { name: '{{provider}}', description: 'Training provider (inside loop)', category: 'Training', example: 'NDIS Commission', loopParent: '{{#training}}' },
  { name: '{{date_completed}}', description: 'Completion date (inside loop)', category: 'Training', example: '10/01/2026', loopParent: '{{#training}}' },
  { name: '{{expiry_date}}', description: 'Expiry date (inside loop)', category: 'Training', example: '10/01/2027', loopParent: '{{#training}}' },
  { name: '{{file_name}}', description: 'Evidence file name (inside loop)', category: 'Training', example: 'training_cert.pdf', loopParent: '{{#training}}' },
  { name: '{{/training}}', description: 'End of training loop', category: 'Training', example: '{{/training}}', isLoopEnd: true },

  // Compliance Loop (grouped under Compliance)
  { name: '{{#compliance}}', description: 'Start of compliance loop', category: 'Compliance', example: '{{#compliance}}', isLoopStart: true },
  { name: '{{compliance_name}}', description: 'Compliance requirement name (inside loop)', category: 'Compliance', example: 'NDIS Worker Screening Check', loopParent: '{{#compliance}}' },
  { name: '{{completion_date}}', description: 'Completion date (inside loop)', category: 'Compliance', example: '20/02/2026', loopParent: '{{#compliance}}' },
  { name: '{{expiry_date}}', description: 'Expiry date (inside loop)', category: 'Compliance', example: '20/02/2027', loopParent: '{{#compliance}}' },
  { name: '{{/compliance}}', description: 'End of compliance loop', category: 'Compliance', example: '{{/compliance}}', isLoopEnd: true },
];

/**
 * Maps a raw Staff object from the DAL to the tag structure expected by docxtemplater.
 */
export function mapStaffToTags(
  staff: any,
  relatedData?: {
    compliance?: any[];
    training?: any[];
    qualifications?: any[];
  }
) {
  const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-AU') : '-';

  return {
    staff_name: staff.staff_name || '',
    email: staff.email || '',
    phone: staff.phone || '',
    address: staff.address || '',
    date_of_birth: staff.date_of_birth || '-',
    status: staff.status || '',
    hire_date: formatDate(staff.hire_date),
    separation_date: formatDate(staff.separation_date),
    role: staff.ic_roles?.role_name || staff.role?.role_name || '',
    manager_name: staff.manager_info?.staff_name || staff.manager?.staff_name || '',
    emergency_contact_name: staff.emergency_contact_name || '',
    emergency_contact_phone: staff.emergency_contact_phone || '',
    allergies: staff.allergies || '',
    hobbies: staff.hobbies || '',
    availability: staff.availability || '',
    notes: staff.notes || '',
    department: staff.department_info?.department_name || '',
    employment_type: staff.employment_type_info?.employment_type_name || '',

    // Relational Arrays (Loops)
    qualifications: (relatedData?.qualifications || [])
      .map((q: any) => ({
        title: q.title || '',
        institution: q.institution || '',
        date_completed: formatDate(q.date_completed),
        expiry_date: formatDate(q.expiry_date),
        file_name: q.file_name || '',
      })),

    training: (relatedData?.training || [])
      .map((t: any) => ({
        title: t.title || '',
        category: t.category || '',
        description: t.description || '',
        provider: t.provider || '',
        date_completed: formatDate(t.date_completed),
        expiry_date: formatDate(t.expiry_date),
        file_name: t.file_name || '',
      })),

    compliance: (relatedData?.compliance || [])
      .filter((c: any) => c.status === 'complete')
      .map((c: any) => ({
        compliance_name: c.compliance_type?.compliance_name || c.compliance_name || '',
        completion_date: formatDate(c.completion_date),
        expiry_date: formatDate(c.expiry_date),
      })),
  };
}
