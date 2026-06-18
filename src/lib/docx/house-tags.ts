import { TemplateTag } from './types';
import { flattenMappedArray } from './generator';

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

  // Residents Flat Indexed Tags
  { name: '{{participant_name1}}', description: 'Resident 1 Name', category: 'Participants', example: 'John Doe' },
  { name: '{{ndis_number1}}', description: 'Resident 1 NDIS Number', category: 'Participants', example: '430 000 000' },
  { name: '{{email1}}', description: 'Resident 1 Email', category: 'Participants', example: 'john.doe@example.com' },
  { name: '{{personal_mobile1}}', description: 'Resident 1 Mobile', category: 'Participants', example: '0400 000 000' },
  { name: '{{date_of_birth1}}', description: 'Resident 1 Date of Birth', category: 'Participants', example: '15/05/1990' },

  // House Staff Flat Indexed Tags
  { name: '{{staff_name1}}', description: 'Assigned Staff 1 Name', category: 'Staff', example: 'Jane Smith' },
  { name: '{{staff_role1}}', description: 'Assigned Staff 1 Role', category: 'Staff', example: 'Support Worker' },
  { name: '{{staff_email1}}', description: 'Assigned Staff 1 Email', category: 'Staff', example: 'jane.smith@insidecare.com' },
  { name: '{{staff_phone1}}', description: 'Assigned Staff 1 Phone', category: 'Staff', example: '0411 111 111' },
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

  // Relational Arrays (Mapped first to be used in both loops and flat indexed tags)
  const mappedResidents = (relatedData?.residents || [])
    .filter((r: any) => r.status === 'active')
    .map((r: any) => ({
      participant_name: r.participant_name || '',
      ndis_number: r.ndis_number || '',
      email: r.email || '',
      personal_mobile: r.personal_mobile || '',
      date_of_birth: formatDate(r.date_of_birth),
    }));

  const mappedStaff = (relatedData?.staff || [])
    .filter((s: any) => s.status === 'active' && s.staff?.status === 'active')
    .map((s: any) => ({
      staff_name: s.staff?.staff_name || s.staff_name || '',
      role: s.staff?.role?.role_name || s.role || '',
      email: s.staff?.email || '',
      phone: s.staff?.phone || '',
    }));

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
    residents: mappedResidents,
    staff: mappedStaff,

    // Flat Indexed Tags (1-10)
    ...flattenMappedArray(mappedResidents, {
      participant_name: 'participant_name',
      ndis_number: 'ndis_number',
      email: 'email',
      personal_mobile: 'personal_mobile',
      date_of_birth: 'date_of_birth',
    }),
    ...flattenMappedArray(mappedStaff, {
      staff_name: 'staff_name',
      role: 'staff_role',
      email: 'staff_email',
      phone: 'staff_phone',
    }),
  };
}
