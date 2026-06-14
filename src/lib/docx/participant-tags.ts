/**
 * Definitions and mapping for Participant Template Tags.
 * Category groupings exactly match the sections on the Participant Detail page.
 */

import { TemplateTag } from './types';

/**
 * The master list of available tags for the UI Data Dictionary.
 * Grouped to match the Participant Detail page section headers.
 */
export const PARTICIPANT_TEMPLATE_TAGS: TemplateTag[] = [
  // Personal Details
  { name: '{{full_name}}', description: "Participant's full name", category: 'Personal Details', example: 'John Doe' },
  { name: '{{first_name}}', description: "Participant's first name", category: 'Personal Details', example: 'John' },
  { name: '{{last_name}}', description: "Participant's last name", category: 'Personal Details', example: 'Doe' },
  { name: '{{date_of_birth}}', description: 'Date of birth (DD/MM/YYYY)', category: 'Personal Details', example: '15/05/1990' },
  { name: '{{email}}', description: 'Personal email address', category: 'Personal Details', example: 'john.doe@example.com' },
  { name: '{{personal_mobile}}', description: 'Personal mobile number', category: 'Personal Details', example: '0400 000 000' },
  { name: '{{address}}', description: 'Residential address', category: 'Personal Details', example: '123 Main St, Sydney' },
  { name: '{{ndis_number}}', description: 'NDIS Number', category: 'Personal Details', example: '430 000 000' },
  { name: '{{status}}', description: 'Profile status (active, draft, etc.)', category: 'Personal Details', example: 'active' },
  { name: '{{support_coordinator}}', description: 'Support Coordinator name', category: 'Personal Details', example: 'Sarah Smith' },
  { name: '{{support_level}}', description: 'NDIS Support Level', category: 'Personal Details', example: 'Standard' },
  { name: '{{service_providers}}', description: 'List of other service providers', category: 'Personal Details', example: 'Physio Co, Speech Hub' },
  { name: '{{move_in_date}}', description: 'Move-in date (DD/MM/YYYY)', category: 'Personal Details', example: '01/01/2024' },

  // Goals
  { name: '{{current_goals}}', description: 'Summary of current care plan goals', category: 'Goals', example: 'Increase independence in cooking' },

  // Behaviour & Support
  { name: '{{behaviour_of_concern}}', description: 'Summary of behaviours of concern', category: 'Behaviour & Support', example: 'Pacing when anxious' },
  { name: '{{pbsp_engaged}}', description: 'Is a PBSP Engaged? (Yes/No)', category: 'Behaviour & Support', example: 'Yes' },
  { name: '{{bsp_available}}', description: 'Is a BSP document available? (Yes/No)', category: 'Behaviour & Support', example: 'No' },
  { name: '{{specialist_name}}', description: 'Behaviour Specialist Name', category: 'Behaviour & Support', example: 'Dr. Emily Watson' },
  { name: '{{specialist_phone}}', description: 'Behaviour Specialist Phone', category: 'Behaviour & Support', example: '0400 000 000' },
  { name: '{{specialist_email}}', description: 'Behaviour Specialist Email', category: 'Behaviour & Support', example: 'specialist@example.com' },
  { name: '{{restrictive_practices_yn}}', description: 'Are restrictive practices used? (Yes/No)', category: 'Behaviour & Support', example: 'Yes' },
  { name: '{{restrictive_practices}}', description: 'Qualitative notes on restrictive practices', category: 'Behaviour & Support', example: 'Requires supervision in public areas' },
  { name: '{{restrictive_practice_details}}', description: 'Details of restrictive practices', category: 'Behaviour & Support', example: 'Locked cupboard for sharps' },
  { name: '{{restrictive_practice_authorisation}}', description: 'Is authorization current? (Yes/No)', category: 'Behaviour & Support', example: 'Yes' },

  // Support Needs
  { name: '{{routine}}', description: 'Daily routine summary', category: 'Support Needs', example: 'Wakes at 7am, tea at 8am' },
  { name: '{{hygiene_support}}', description: 'Personal hygiene support needs', category: 'Support Needs', example: 'Requires prompting for showering' },
  { name: '{{mobility_support}}', description: 'Mobility support requirements', category: 'Support Needs', example: 'Uses a walking frame for long distances' },
  { name: '{{meal_prep_support}}', description: 'Meal preparation support needs', category: 'Support Needs', example: 'Full assistance with cooking' },
  { name: '{{household_support}}', description: 'Household cleaning/laundry support', category: 'Support Needs', example: 'Needs help with heavy cleaning' },
  { name: '{{finance_support}}', description: 'Financial management support needs', category: 'Support Needs', example: 'Requires help with budgeting' },
  { name: '{{health_wellbeing_support}}', description: 'Health and wellbeing support', category: 'Support Needs', example: 'Needs reminders for hydration' },
  { name: '{{cultural_religious_support}}', description: 'Cultural and religious needs', category: 'Support Needs', example: 'Attends church on Sundays' },
  { name: '{{communication_type}}', description: 'Preferred communication method', category: 'Support Needs', example: 'Verbal' },
  { name: '{{communication_notes}}', description: 'Specific communication notes', category: 'Support Needs', example: 'Speaks clearly but slowly' },
  { name: '{{communication_language_needs}}', description: 'Language or ESL requirements', category: 'Support Needs', example: 'Fluent in Auslan' },
  { name: '{{other_support}}', description: 'Miscellaneous support needs', category: 'Support Needs', example: 'Prefers quiet environments' },

  // Mealtime Management
  { name: '{{mtmp_required}}', description: 'Is a Mealtime Management Plan required? (Yes/No)', category: 'Mealtime Management', example: 'Yes' },
  { name: '{{mtmp_details}}', description: 'Details of MTMP requirements', category: 'Mealtime Management', example: 'Soft/Bite-sized diet' },

  // Clinical Details
  { name: '{{primary_diagnosis}}', description: 'Primary Diagnosis', category: 'Clinical Details', example: 'Autism Spectrum Disorder' },
  { name: '{{secondary_diagnosis}}', description: 'Secondary Diagnosis', category: 'Clinical Details', example: 'Anxiety' },
  { name: '{{allergies}}', description: 'List of allergies', category: 'Clinical Details', example: 'Peanuts, Penicillin' },
  { name: '{{general_notes}}', description: 'General clinical/background notes', category: 'Clinical Details', example: 'History of sensitive skin' },

  // Medical Routine
  { name: '{{pharmacy_name}}', description: 'Primary Pharmacy Name', category: 'Medical Routine', example: 'Chemist Warehouse' },
  { name: '{{pharmacy_contact}}', description: 'Pharmacy Contact Number', category: 'Medical Routine', example: '02 9000 0000' },
  { name: '{{gp_name}}', description: 'GP Name', category: 'Medical Routine', example: 'Dr. Kevin Lin' },
  { name: '{{gp_contact}}', description: 'GP Contact Number', category: 'Medical Routine', example: '02 8000 0000' },
  { name: '{{gp_location}}', description: 'GP Location/Address', category: 'Medical Routine', example: '45 Medical St, Sydney' },
  { name: '{{pharmacy_location}}', description: 'Pharmacy Location/Address', category: 'Medical Routine', example: '12 Chemist Ave, Sydney' },
  { name: '{{psychiatrist_name}}', description: 'Psychiatrist Name', category: 'Medical Routine', example: 'Dr. Laura Chen' },
  { name: '{{psychiatrist_contact}}', description: 'Psychiatrist Contact Number', category: 'Medical Routine', example: '02 6000 0000' },
  { name: '{{psychiatrist_location}}', description: 'Psychiatrist Location/Address', category: 'Medical Routine', example: '78 Mind St, Sydney' },
  { name: '{{medical_routine_other}}', description: 'Other medical routine notes', category: 'Medical Routine', example: 'Needs a support worker to drive' },
  { name: '{{medical_routine_general_process}}', description: 'Process for medical appointments', category: 'Medical Routine', example: 'Staff to accompany to all appts' },

  // Medications
  { name: '{{current_medications}}', description: 'Summary of current medications', category: 'Medications', example: 'Panadol 500mg (Daily)' },

  // Emergency Management
  { name: '{{mental_health_plan}}', description: 'Mental Health Crisis Plan', category: 'Emergency Management', example: 'Call specialist if pacing exceeds 1 hour' },
  { name: '{{medical_plan}}', description: 'Emergency Medical Plan', category: 'Emergency Management', example: 'Diabetes management protocol' },
  { name: '{{natural_disaster_plan}}', description: 'Natural Disaster/Relocation Plan', category: 'Emergency Management', example: 'Relocate to sister house in Flood' },

  // Clinical Trackers
  { name: '{{track_bowel}}', description: 'Is Bowel tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'Yes' },
  { name: '{{track_seizure}}', description: 'Is Seizure tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'No' },
  { name: '{{track_sleep}}', description: 'Is Sleep tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'Yes' },
  { name: '{{track_behaviour}}', description: 'Is Behaviour tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'Yes' },
  { name: '{{track_community}}', description: 'Is Community tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'No' },
  { name: '{{track_nutrition}}', description: 'Is Nutrition tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'No' },
  { name: '{{track_mtm}}', description: 'Is Mealtime Management tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'Yes' },
  { name: '{{track_hygiene}}', description: 'Is Hygiene tracking enabled? (Yes/No)', category: 'Clinical Trackers', example: 'No' },

  // House Information (grouped under Personal Details)
  { name: '{{house_name}}', description: 'Name of the assigned house', category: 'Personal Details', example: 'Sunshine Villa' },
  { name: '{{house_phone}}', description: 'House landline number', category: 'Personal Details', example: '02 7000 0000' },

  // Medications List Loop (grouped under Medications)
  { name: '{{#medications}}', description: 'Start of medications loop', category: 'Medications', example: '{{#medications}}', isLoopStart: true },
  { name: '{{medication_name}}', description: 'Medication name (inside medications loop)', category: 'Medications', example: 'Paracetamol', loopParent: '{{#medications}}' },
  { name: '{{brand_name}}', description: 'Brand name (inside medications loop)', category: 'Medications', example: 'Panadol', loopParent: '{{#medications}}' },
  { name: '{{dosage}}', description: 'Dosage instructions (inside medications loop)', category: 'Medications', example: '500mg', loopParent: '{{#medications}}' },
  { name: '{{medication_type}}', description: 'Medication type (inside medications loop)', category: 'Medications', example: 'Analgesic', loopParent: '{{#medications}}' },
  { name: '{{/medications}}', description: 'End of medications loop', category: 'Medications', example: '{{/medications}}', isLoopEnd: true },

  // Goals List Loop (grouped under Goals)
  { name: '{{#goals}}', description: 'Start of goals loop', category: 'Goals', example: '{{#goals}}', isLoopStart: true },
  { name: '{{goal_type}}', description: 'Goal type (inside goals loop)', category: 'Goals', example: 'ndis / identified', loopParent: '{{#goals}}' },
  { name: '{{description}}', description: 'Goal description (inside goals loop)', category: 'Goals', example: 'Build cooking skills', loopParent: '{{#goals}}' },
  { name: '{{/goals}}', description: 'End of goals loop', category: 'Goals', example: '{{/goals}}', isLoopEnd: true },

  // Contacts List Loop (grouped under Contacts)
  { name: '{{#contacts}}', description: 'Start of contacts loop', category: 'Contacts', example: '{{#contacts}}', isLoopStart: true },
  { name: '{{contact_name}}', description: 'Contact name (inside contacts loop)', category: 'Contacts', example: 'John Smith', loopParent: '{{#contacts}}' },
  { name: '{{phone}}', description: 'Contact phone (inside contacts loop)', category: 'Contacts', example: '0400 000 000', loopParent: '{{#contacts}}' },
  { name: '{{email}}', description: 'Contact email (inside contacts loop)', category: 'Contacts', example: 'john@gmail.com', loopParent: '{{#contacts}}' },
  { name: '{{address}}', description: 'Contact address (inside contacts loop)', category: 'Contacts', example: '12 Main St, Melbourne', loopParent: '{{#contacts}}' },
  { name: '{{notes}}', description: 'Contact notes (inside contacts loop)', category: 'Contacts', example: 'Available after 5pm', loopParent: '{{#contacts}}' },
  { name: '{{contact_type}}', description: 'Contact type/relationship (inside contacts loop)', category: 'Contacts', example: 'Guardian', loopParent: '{{#contacts}}' },
  { name: '{{/contacts}}', description: 'End of contacts loop', category: 'Contacts', example: '{{/contacts}}', isLoopEnd: true },

  // Providers List Loop (grouped under Service Providers)
  { name: '{{#providers}}', description: 'Start of providers loop', category: 'Service Providers', example: '{{#providers}}', isLoopStart: true },
  { name: '{{provider_name}}', description: 'Provider name (inside providers loop)', category: 'Service Providers', example: 'Physio Co', loopParent: '{{#providers}}' },
  { name: '{{company}}', description: 'Provider company (inside providers loop)', category: 'Service Providers', example: 'Healthcare Services Ltd', loopParent: '{{#providers}}' },
  { name: '{{provider_type}}', description: 'Provider type (inside providers loop)', category: 'Service Providers', example: 'Physiotherapist', loopParent: '{{#providers}}' },
  { name: '{{phone}}', description: 'Provider phone number (inside providers loop)', category: 'Service Providers', example: '0400 111 222', loopParent: '{{#providers}}' },
  { name: '{{email}}', description: 'Provider email (inside providers loop)', category: 'Service Providers', example: 'info@healthcare.com', loopParent: '{{#providers}}' },
  { name: '{{notes}}', description: 'Provider notes (inside providers loop)', category: 'Service Providers', example: 'Prefers bookings on Tuesdays', loopParent: '{{#providers}}' },
  { name: '{{/providers}}', description: 'End of providers loop', category: 'Service Providers', example: '{{/providers}}', isLoopEnd: true },

  // Funding List Loop (grouped under Funding)
  { name: '{{#funding}}', description: 'Start of funding loop', category: 'Funding', example: '{{#funding}}', isLoopStart: true },
  { name: '{{funding_source}}', description: 'Funding source name (inside funding loop)', category: 'Funding', example: 'NDIS', loopParent: '{{#funding}}' },
  { name: '{{funding_type}}', description: 'Funding type name (inside funding loop)', category: 'Funding', example: 'Core Supports', loopParent: '{{#funding}}' },
  { name: '{{code}}', description: 'Funding code (inside funding loop)', category: 'Funding', example: '1234', loopParent: '{{#funding}}' },
  { name: '{{invoice_recipient}}', description: 'Invoice recipient (inside funding loop)', category: 'Funding', example: 'Plan Manager', loopParent: '{{#funding}}' },
  { name: '{{end_date}}', description: 'Funding budget end date (inside funding loop)', category: 'Funding', example: '30/06/2026', loopParent: '{{#funding}}' },
  { name: '{{allocated_amount}}', description: 'Total allocated budget amount (inside funding loop)', category: 'Funding', example: '$50,000.00', loopParent: '{{#funding}}' },
  { name: '{{total_budget}}', description: 'Alias for allocated amount (inside funding loop)', category: 'Funding', example: '$50,000.00', loopParent: '{{#funding}}' },
  { name: '{{used_amount}}', description: 'Used budget amount (inside funding loop)', category: 'Funding', example: '$26,550.00', loopParent: '{{#funding}}' },
  { name: '{{remaining_amount}}', description: 'Remaining budget amount (inside funding loop)', category: 'Funding', example: '$23,450.00', loopParent: '{{#funding}}' },
  { name: '{{remaining_budget}}', description: 'Alias for remaining amount (inside funding loop)', category: 'Funding', example: '$23,450.00', loopParent: '{{#funding}}' },
  { name: '{{notes}}', description: 'Funding details or notes (inside funding loop)', category: 'Funding', example: 'Excludes travel expenses', loopParent: '{{#funding}}' },
  { name: '{{/funding}}', description: 'End of funding loop', category: 'Funding', example: '{{/funding}}', isLoopEnd: true },
];

/**
 * Maps a raw Participant object from the DAL to the tag structure expected by docxtemplater.
 * Handles formatting for dates, booleans, and nested objects.
 */
export function mapParticipantToTags(
  participant: any,
  relatedData?: {
    medications?: any[];
    goals?: any[];
    contacts?: any[];
    providers?: any[];
    funding?: any[];
  }
) {
  const [firstName, ...lastNameParts] = (participant.participant_name || '').split(' ');
  const lastName = lastNameParts.join(' ');

  const formatBool = (val: any) => (val === true ? 'Yes' : 'No');
  const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-AU') : '-';

  return {
    // Personal Details
    full_name: participant.participant_name || '',
    first_name: firstName || '',
    last_name: lastName || '',
    date_of_birth: formatDate(participant.date_of_birth),
    email: participant.email || '',
    personal_mobile: participant.personal_mobile || '',
    address: participant.address || '',
    ndis_number: participant.ndis_number || '',
    status: participant.status || '',
    support_coordinator: participant.support_coordinator || '',
    support_level: participant.support_level || '',
    service_providers: participant.service_providers || '',
    move_in_date: formatDate(participant.move_in_date),

    // Goals
    current_goals: participant.current_goals || '',

    // Behaviour & Support
    behaviour_of_concern: participant.behaviour_of_concern || '',
    pbsp_engaged: formatBool(participant.pbsp_engaged),
    bsp_available: formatBool(participant.bsp_available),
    specialist_name: participant.specialist_name || '',
    specialist_phone: participant.specialist_phone || '',
    specialist_email: participant.specialist_email || '',
    restrictive_practices_yn: formatBool(participant.restrictive_practices_yn),
    restrictive_practices: participant.restrictive_practices || '',
    restrictive_practice_details: participant.restrictive_practice_details || '',
    restrictive_practice_authorisation: formatBool(participant.restrictive_practice_authorisation),

    // Support Needs
    routine: participant.routine || '',
    hygiene_support: participant.hygiene_support || '',
    mobility_support: participant.mobility_support || '',
    meal_prep_support: participant.meal_prep_support || '',
    household_support: participant.household_support || '',
    finance_support: participant.finance_support || '',
    health_wellbeing_support: participant.health_wellbeing_support || '',
    cultural_religious_support: participant.cultural_religious_support || '',
    communication_type: participant.communication_type || '',
    communication_notes: participant.communication_notes || '',
    communication_language_needs: participant.communication_language_needs || '',
    other_support: participant.other_support || '',

    // Mealtime Management
    mtmp_required: formatBool(participant.mtmp_required),
    mtmp_details: participant.mtmp_details || '',

    // Clinical Details
    primary_diagnosis: participant.primary_diagnosis || '',
    secondary_diagnosis: participant.secondary_diagnosis || '',
    allergies: participant.allergies || '',
    general_notes: participant.general_notes || '',

    // Medical Routine
    pharmacy_name: participant.pharmacy_name || '',
    pharmacy_contact: participant.pharmacy_contact || '',
    pharmacy_location: participant.pharmacy_location || '',
    gp_name: participant.gp_name || '',
    gp_contact: participant.gp_contact || '',
    gp_location: participant.gp_location || '',
    psychiatrist_name: participant.psychiatrist_name || '',
    psychiatrist_contact: participant.psychiatrist_contact || '',
    psychiatrist_location: participant.psychiatrist_location || '',
    medical_routine_other: participant.medical_routine_other || '',
    medical_routine_general_process: participant.medical_routine_general_process || '',

    // Medications
    current_medications: participant.current_medications || '',

    // Emergency Management
    mental_health_plan: participant.mental_health_plan || '',
    medical_plan: participant.medical_plan || '',
    natural_disaster_plan: participant.natural_disaster_plan || '',

    // Clinical Trackers
    track_bowel: formatBool(participant.track_bowel),
    track_seizure: formatBool(participant.track_seizure),
    track_sleep: formatBool(participant.track_sleep),
    track_behaviour: formatBool(participant.track_behaviour),
    track_community: formatBool(participant.track_community),
    track_nutrition: formatBool(participant.track_nutrition),
    track_mtm: formatBool(participant.track_mtm),
    track_hygiene: formatBool(participant.track_hygiene),

    // House Information
    house_name: participant.houses?.house_name || participant.house_name || '',
    house_phone: participant.house_phone || '',

    // Relational Arrays (Loops)
    medications: (relatedData?.medications || [])
      .filter((m: any) => m.is_active === true)
      .map((m: any) => ({
        medication_name: m.medication_info?.medication_name || '',
        brand_name: m.medication_info?.brand_name || '',
        dosage: m.dosage || '',
        medication_type: m.medication_info?.medication_type?.medication_type_name || '',
      })),

    goals: (relatedData?.goals || [])
      .filter((g: any) => g.is_active === true)
      .map((g: any) => ({
        goal_type: g.goal_type || '',
        description: g.description || '',
      })),

    contacts: (relatedData?.contacts || [])
      .filter((c: any) => c.is_active === true)
      .map((c: any) => ({
        contact_name: c.contact_name || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        notes: c.notes || '',
        contact_type: c.contact_type_info?.contact_type_name || c.contact_type?.contact_type_name || '',
      })),

    providers: (relatedData?.providers || [])
      .filter((p: any) => p.is_active === true)
      .map((p: any) => ({
        provider_name: p.provider_name || '',
        company: p.company || '',
        provider_type: p.provider_type || '',
        phone: p.phone || '',
        email: p.email || '',
        notes: p.notes || '',
      })),

    funding: (relatedData?.funding || [])
      .filter((f: any) => f.status?.toLowerCase() === 'active')
      .map((f: any) => {
        const formatCurrency = (val: any) => val ? `$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
        return {
          funding_source: f.funding_source_info?.funding_source_name || '',
          funding_type: f.funding_type_info?.funding_type_name || '',
          code: f.code || '',
          invoice_recipient: f.invoice_recipient || '',
          end_date: formatDate(f.end_date),
          allocated_amount: formatCurrency(f.allocated_amount),
          total_budget: formatCurrency(f.allocated_amount), // alias
          used_amount: formatCurrency(f.used_amount),
          remaining_amount: formatCurrency(f.remaining_amount),
          remaining_budget: formatCurrency(f.remaining_amount), // alias
          notes: f.notes || '',
        };
      }),
  };
}
