import { TemplateTag } from './types';

/**
 * Definitions and mapping for House Template Tags.
 */
export const HOUSE_TEMPLATE_TAGS: TemplateTag[] = [
  // House Details
  { name: '{{house_name}}', description: 'Name of the residential house', category: 'House Details', example: 'Sunshine Villa' },
  { name: '{{address}}', description: 'Physical address', category: 'House Details', example: '123 Care Lane, Sydney' },
  { name: '{{phone}}', description: 'House landline number', category: 'House Details', example: '02 9000 0000' },
  { name: '{{status}}', description: 'Current status (active, inactive)', category: 'House Details', example: 'active' },

  // House Management & Capacity
  { name: '{{house_manager}}', description: 'Name of the House Manager', category: 'House Management', example: 'John Smith' },
  { name: '{{capacity}}', description: 'Total participant capacity', category: 'House Management', example: '5' },
  { name: '{{current_occupancy}}', description: 'Current number of residents', category: 'House Management', example: '3' },
  { name: '{{notes}}', description: 'General house notes/details', category: 'House Management', example: 'Wheelchair accessible' },
  { name: '{{general_house_details}}', description: 'General house routines, preferences, and rules', category: 'House Management', example: 'Keep kitchen light on at night' },
  { name: '{{individuals_breakdown}}', description: 'Qualitative description of each person residing in the house', category: 'House Management', example: 'Person A prefers quiet space...' },
  { name: '{{participant_dynamics}}', description: 'Social dynamics and interactions within participants', category: 'House Management', example: 'Socializes well during dinner' },
  { name: '{{risk_management}}', description: 'House-level risk management strategies and alerts', category: 'House Management', example: 'Ensure back door is locked at 9pm' },
  { name: '{{observations}}', description: 'Staff observations regarding the house environment', category: 'House Management', example: 'Increased activity on weekends' },

  // Residents Loop (Participants)
  { name: '{{#residents}}', description: 'Start of residents loop', category: 'Participants', example: '{{#residents}}', isLoopStart: true },
  { name: '{{participant_name}}', description: 'Participant name (inside residents loop)', category: 'Participants', example: 'John Doe', loopParent: '{{#residents}}' },
  { name: '{{ndis_number}}', description: 'NDIS number (inside residents loop)', category: 'Participants', example: '430 000 000', loopParent: '{{#residents}}' },
  { name: '{{email}}', description: 'Participant email (inside residents loop)', category: 'Participants', example: 'john.doe@example.com', loopParent: '{{#residents}}' },
  { name: '{{personal_mobile}}', description: 'Participant mobile number (inside residents loop)', category: 'Participants', example: '0400 000 000', loopParent: '{{#residents}}' },
  { name: '{{date_of_birth}}', description: 'Participant date of birth (inside residents loop)', category: 'Participants', example: '15/05/1990', loopParent: '{{#residents}}' },
  { name: '{{/residents}}', description: 'End of residents loop', category: 'Participants', example: '{{/residents}}', isLoopEnd: true },

  // Staff Assignments Loop
  { name: '{{#staff}}', description: 'Start of staff assignments loop', category: 'Staff', example: '{{#staff}}', isLoopStart: true },
  { name: '{{staff_name}}', description: 'Staff name (inside staff loop)', category: 'Staff', example: 'Jane Smith', loopParent: '{{#staff}}' },
  { name: '{{role}}', description: 'Staff role (inside staff loop)', category: 'Staff', example: 'Support Worker', loopParent: '{{#staff}}' },
  { name: '{{email}}', description: 'Staff email (inside staff loop)', category: 'Staff', example: 'jane.smith@insidecare.com', loopParent: '{{#staff}}' },
  { name: '{{phone}}', description: 'Staff phone number (inside staff loop)', category: 'Staff', example: '0411 111 111', loopParent: '{{#staff}}' },
  { name: '{{/staff}}', description: 'End of staff loop', category: 'Staff', example: '{{/staff}}', isLoopEnd: true },
];

/**
 * Maps a raw House object from the DAL to the tag structure expected by docxtemplater.
 */
export function mapHouseToTags(
  house: any,
  relatedData?: {
    residents?: any[];
    staff?: any[];
  }
) {
  const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-AU') : '-';

  return {
    house_name: house.house_name || '',
    address: house.address || '',
    phone: house.phone || '',
    status: house.status || '',
    house_manager: house.house_manager || '',
    capacity: house.capacity || 0,
    current_occupancy: house.current_occupancy || 0,
    notes: house.notes || '',
    general_house_details: house.general_house_details || '',
    individuals_breakdown: house.individuals_breakdown || '',
    participant_dynamics: house.participant_dynamics || '',
    risk_management: house.risk_management || '',
    observations: house.observations || '',

    // Relational Arrays (Loops)
    residents: (relatedData?.residents || [])
      .filter((r: any) => r.status === 'active')
      .map((r: any) => ({
        participant_name: r.participant_name || '',
        ndis_number: r.ndis_number || '',
        email: r.email || '',
        personal_mobile: r.personal_mobile || '',
        date_of_birth: formatDate(r.date_of_birth),
      })),

    staff: (relatedData?.staff || [])
      .filter((s: any) => s.status === 'active' && s.staff?.status === 'active')
      .map((s: any) => ({
        staff_name: s.staff?.staff_name || s.staff_name || '',
        role: s.staff?.role?.role_name || s.role || '',
        email: s.staff?.email || '',
        phone: s.staff?.phone || '',
      })),
  };
}
