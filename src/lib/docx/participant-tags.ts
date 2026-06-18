/**
 * Definitions and mapping for Participant Template Tags.
 * Category groupings exactly match the sections on the Participant Detail page.
 */

import { TemplateTag } from './types';
import { flattenMappedArray } from './generator';

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

  // Medications Flat Indexed Tags
  { name: '{{medication_name1}}', description: 'Medication 1 Name', category: 'Medications', example: 'Paracetamol' },
  { name: '{{brand_name1}}', description: 'Medication 1 Brand Name', category: 'Medications', example: 'Panadol' },
  { name: '{{dosage1}}', description: 'Medication 1 Dosage', category: 'Medications', example: '500mg' },
  { name: '{{medication_type1}}', description: 'Medication 1 Type', category: 'Medications', example: 'Analgesic' },

  // Goals Flat Indexed Tags
  { name: '{{goal_type1}}', description: 'Goal 1 Type', category: 'Goals', example: 'ndis' },
  { name: '{{goal_description1}}', description: 'Goal 1 Description', category: 'Goals', example: 'Build cooking skills' },

  // Contacts Flat Indexed Tags
  { name: '{{contact_name1}}', description: 'Contact 1 Name', category: 'Contacts', example: 'John Smith' },
  { name: '{{contact_phone1}}', description: 'Contact 1 Phone', category: 'Contacts', example: '0400 000 000' },
  { name: '{{contact_email1}}', description: 'Contact 1 Email', category: 'Contacts', example: 'john@gmail.com' },
  { name: '{{contact_address1}}', description: 'Contact 1 Address', category: 'Contacts', example: '12 Main St, Melbourne' },
  { name: '{{contact_notes1}}', description: 'Contact 1 Notes', category: 'Contacts', example: 'Available after 5pm' },
  { name: '{{contact_type1}}', description: 'Contact 1 Type/Relationship', category: 'Contacts', example: 'Guardian' },

  // Providers Flat Indexed Tags
  { name: '{{provider_name1}}', description: 'Provider 1 Name', category: 'Service Providers', example: 'Physio Co' },
  { name: '{{provider_company1}}', description: 'Provider 1 Company', category: 'Service Providers', example: 'Healthcare Services Ltd' },
  { name: '{{provider_type1}}', description: 'Provider 1 Type', category: 'Service Providers', example: 'Physiotherapist' },
  { name: '{{provider_phone1}}', description: 'Provider 1 Phone', category: 'Service Providers', example: '0400 111 222' },
  { name: '{{provider_email1}}', description: 'Provider 1 Email', category: 'Service Providers', example: 'info@healthcare.com' },
  { name: '{{provider_notes1}}', description: 'Provider 1 Notes', category: 'Service Providers', example: 'Prefers bookings on Tuesdays' },

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
  }
) {
  const [firstName, ...lastNameParts] = (participant.participant_name || '').split(' ');
  const lastName = lastNameParts.join(' ');

  const formatBool = (val: any) => (val === true ? 'Yes' : 'No');
  const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-AU') : '-';

  // Relational Arrays (Mapped first to be used in both loops and flat indexed tags)
  const mappedMedications = (relatedData?.medications || [])
    .filter((m: any) => m.is_active === true)
    .map((m: any) => ({
      medication_name: m.medication_info?.medication_name || '',
      brand_name: m.medication_info?.brand_name || '',
      dosage: m.dosage || '',
      medication_type: m.medication_info?.medication_type?.medication_type_name || '',
    }));

  const mappedGoals = (relatedData?.goals || [])
    .filter((g: any) => g.is_active === true)
    .map((g: any) => ({
      goal_type: g.goal_type || '',
      description: g.description || '',
    }));

  const mappedContacts = (relatedData?.contacts || [])
    .filter((c: any) => c.is_active === true)
    .map((c: any) => ({
      contact_name: c.contact_name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
      contact_type: c.contact_type_info?.contact_type_name || c.contact_type?.contact_type_name || '',
    }));

  const mappedProviders = (relatedData?.providers || [])
    .filter((p: any) => p.is_active === true)
    .map((p: any) => ({
      provider_name: p.provider_name || '',
      company: p.company || '',
      provider_type: p.provider_type || '',
      phone: p.phone || '',
      email: p.email || '',
      notes: p.notes || '',
    }));

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
    medications: mappedMedications,
    goals: mappedGoals,
    contacts: mappedContacts,
    providers: mappedProviders,

    // Flat Indexed Tags (1-10)
    ...flattenMappedArray(mappedMedications, {
      medication_name: 'medication_name',
      brand_name: 'brand_name',
      dosage: 'dosage',
      medication_type: 'medication_type',
    }),
    ...flattenMappedArray(mappedGoals, {
      goal_type: 'goal_type',
      description: 'goal_description',
    }),
    ...flattenMappedArray(mappedContacts, {
      contact_name: 'contact_name',
      phone: 'contact_phone',
      email: 'contact_email',
      address: 'contact_address',
      notes: 'contact_notes',
      contact_type: 'contact_type',
    }),
    ...flattenMappedArray(mappedProviders, {
      provider_name: 'provider_name',
      company: 'provider_company',
      provider_type: 'provider_type',
      phone: 'provider_phone',
      email: 'provider_email',
      notes: 'provider_notes',
    }),
  };
}
