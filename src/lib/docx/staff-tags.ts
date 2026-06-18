import { TemplateTag } from './types';
import { flattenMappedArray } from './generator';

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

  // Qualifications Flat Indexed Tags
  { name: '{{qualification_title1}}', description: 'Qualification 1 Title', category: 'Qualifications', example: 'First Aid Certificate' },
  { name: '{{qualification_institution1}}', description: 'Qualification 1 Institution', category: 'Qualifications', example: 'Red Cross' },
  { name: '{{qualification_date_completed1}}', description: 'Qualification 1 Date Completed', category: 'Qualifications', example: '15/05/2025' },
  { name: '{{qualification_expiry_date1}}', description: 'Qualification 1 Expiry Date', category: 'Qualifications', example: '15/05/2028' },
  { name: '{{qualification_file_name1}}', description: 'Qualification 1 File Name', category: 'Qualifications', example: 'cert.pdf' },

  // Training Flat Indexed Tags
  { name: '{{training_title1}}', description: 'Training 1 Title', category: 'Training', example: 'Ndis Induction' },
  { name: '{{training_category1}}', description: 'Training 1 Category', category: 'Training', example: 'Induction' },
  { name: '{{training_description1}}', description: 'Training 1 Description', category: 'Training', example: 'Overview of standard policies' },
  { name: '{{training_provider1}}', description: 'Training 1 Provider', category: 'Training', example: 'NDIS Commission' },
  { name: '{{training_date_completed1}}', description: 'Training 1 Date Completed', category: 'Training', example: '10/01/2026' },
  { name: '{{training_expiry_date1}}', description: 'Training 1 Expiry Date', category: 'Training', example: '10/01/2027' },
  { name: '{{training_file_name1}}', description: 'Training 1 File Name', category: 'Training', example: 'training_cert.pdf' },

  // Compliance Flat Indexed Tags
  { name: '{{compliance_name1}}', description: 'Compliance 1 Requirement Name', category: 'Compliance', example: 'NDIS Worker Screening Check' },
  { name: '{{compliance_completion_date1}}', description: 'Compliance 1 Completion Date', category: 'Compliance', example: '20/02/2026' },
  { name: '{{compliance_expiry_date1}}', description: 'Compliance 1 Expiry Date', category: 'Compliance', example: '20/02/2027' },
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

  // Relational Arrays (Mapped first to be used in both loops and flat indexed tags)
  const mappedQualifications = (relatedData?.qualifications || [])
    .map((q: any) => ({
      title: q.title || '',
      institution: q.institution || '',
      date_completed: formatDate(q.date_completed),
      expiry_date: formatDate(q.expiry_date),
      file_name: q.file_name || '',
    }));

  const mappedTraining = (relatedData?.training || [])
    .map((t: any) => ({
      title: t.title || '',
      category: t.category || '',
      description: t.description || '',
      provider: t.provider || '',
      date_completed: formatDate(t.date_completed),
      expiry_date: formatDate(t.expiry_date),
      file_name: t.file_name || '',
    }));

  const mappedCompliance = (relatedData?.compliance || [])
    .filter((c: any) => c.status === 'complete')
    .map((c: any) => ({
      compliance_name: c.compliance_type?.compliance_name || c.compliance_name || '',
      completion_date: formatDate(c.completion_date),
      expiry_date: formatDate(c.expiry_date),
    }));

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
    qualifications: mappedQualifications,
    training: mappedTraining,
    compliance: mappedCompliance,

    // Flat Indexed Tags (1-10)
    ...flattenMappedArray(mappedQualifications, {
      title: 'qualification_title',
      institution: 'qualification_institution',
      date_completed: 'qualification_date_completed',
      expiry_date: 'qualification_expiry_date',
      file_name: 'qualification_file_name',
    }),
    ...flattenMappedArray(mappedTraining, {
      title: 'training_title',
      category: 'training_category',
      description: 'training_description',
      provider: 'training_provider',
      date_completed: 'training_date_completed',
      expiry_date: 'training_expiry_date',
      file_name: 'training_file_name',
    }),
    ...flattenMappedArray(mappedCompliance, {
      compliance_name: 'compliance_name',
      completion_date: 'compliance_completion_date',
      expiry_date: 'compliance_expiry_date',
    }),
  };
}
