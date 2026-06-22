import { TemplateTag } from './types';

export const SHIFT_NOTE_TEMPLATE_TAGS: TemplateTag[] = [
  // General Info
  { name: '{{reference_id}}', description: 'Shift Note Reference ID', category: 'General Info', example: 'SN-001' },
  { name: '{{participant_name}}', description: 'Participant Name', category: 'General Info', example: 'John Doe' },
  { name: '{{staff_name}}', description: 'Staff Name (Support Worker)', category: 'General Info', example: 'Sarah Smith' },
  { name: '{{house_name}}', description: 'House Name', category: 'General Info', example: 'Sunshine Villa' },
  { name: '{{start_date}}', description: 'Shift Date (DD/MM/YYYY)', category: 'General Info', example: '15/05/2026' },
  { name: '{{shift_time}}', description: 'Shift Time / Session', category: 'General Info', example: 'Morning' },
  { name: '{{shift_type}}', description: 'Shift Type', category: 'General Info', example: 'Active' },
  { name: '{{overall_presentation}}', description: 'Overall presentation/mood', category: 'General Info', example: 'Happy and cooperative' },
  { name: '{{notes}}', description: 'Brief shift note summary', category: 'General Info', example: 'Had a productive day...' },
  { name: '{{full_note}}', description: 'Full comprehensive note text', category: 'General Info', example: 'John woke up early...' },
  { name: '{{status}}', description: 'Status of the shift note', category: 'General Info', example: 'active' },

  // Support Provided
  { name: '{{adl_supports}}', description: 'ADL Support provided details', category: 'Support Provided', example: 'Assisted with morning shower' },
  { name: '{{domestic_tasks}}', description: 'Domestic Tasks completed', category: 'Support Provided', example: 'Cleaned kitchen after breakfast' },
  { name: '{{capacity_building_goals}}', description: 'Goals addressed during shift', category: 'Support Provided', example: 'Practiced counting change' },

  // Medications
  { name: '{{regular_medication_status}}', description: 'Regular medication status', category: 'Medications', example: 'Administered and signed' },
  { name: '{{prn_medication_given}}', description: 'Whether PRN medication was given (Yes/No)', category: 'Medications', example: 'Yes' },
  { name: '{{prn_description}}', description: 'PRN medication details/reason', category: 'Medications', example: 'Panadol 500mg given for headache' },

  // PBS & Restrictive Practices
  { name: '{{pbs_strategies_used}}', description: 'Whether PBS strategies were used (Yes/No)', category: 'PBS & Restrictive Practices', example: 'Yes' },
  { name: '{{pbs_strategies_details}}', description: 'Details of PBS strategies used', category: 'PBS & Restrictive Practices', example: 'Used verbal distraction technique' },
  { name: '{{pbs_when_used}}', description: 'When PBS strategies were used', category: 'PBS & Restrictive Practices', example: 'When participant became agitated by construction' },
  { name: '{{pbs_outcome}}', description: 'Outcome of the PBS strategies', category: 'PBS & Restrictive Practices', example: 'Calmed down and returned to task' },
  { name: '{{restrictive_practices_status}}', description: 'Restrictive practices details during shift', category: 'PBS & Restrictive Practices', example: 'None used' },

  // Risks Observed
  { name: '{{risks_observed}}', description: 'Whether risks were observed (Yes/No)', category: 'Risks Observed', example: 'No' },
  { name: '{{risk_description}}', description: 'Description of observed risks', category: 'Risks Observed', example: 'Slight slip risk near pool area' },

  // Trackers: Bowel
  { name: '{{bowel_movement_occurred}}', description: 'Whether a bowel movement occurred (Yes/No)', category: 'Trackers: Bowel', example: 'Yes' },
  { name: '{{bowel_time}}', description: 'Time of bowel movement', category: 'Trackers: Bowel', example: '08:30' },
  { name: '{{bowel_bristol_scale}}', description: 'Bristol Stool Chart Scale (1-7)', category: 'Trackers: Bowel', example: '4' },
  { name: '{{bowel_amount}}', description: 'Amount of bowel movement', category: 'Trackers: Bowel', example: 'Medium' },
  { name: '{{bowel_assistance}}', description: 'Assistance level required', category: 'Trackers: Bowel', example: 'Independent' },
  { name: '{{bowel_notes}}', description: 'Extra bowel tracking notes', category: 'Trackers: Bowel', example: 'Normal bowel movement' },

  // Trackers: Seizure
  { name: '{{seizure_occurred}}', description: 'Whether a seizure occurred (Yes/No)', category: 'Trackers: Seizure', example: 'No' },
  { name: '{{seizure_time_started}}', description: 'Time seizure started', category: 'Trackers: Seizure', example: '14:20' },
  { name: '{{seizure_duration_minutes}}', description: 'Duration in minutes', category: 'Trackers: Seizure', example: '3' },
  { name: '{{seizure_type}}', description: 'Type of seizure', category: 'Trackers: Seizure', example: 'Tonic-Clonic' },
  { name: '{{seizure_description}}', description: 'Description of seizure', category: 'Trackers: Seizure', example: 'Loss of consciousness' },
  { name: '{{seizure_injury_occurred}}', description: 'Whether an injury occurred (Yes/No)', category: 'Trackers: Seizure', example: 'No' },
  { name: '{{seizure_injury_description}}', description: 'Description of injuries', category: 'Trackers: Seizure', example: 'Minor scrape on elbow' },
  { name: '{{seizure_emergency_services}}', description: 'Whether emergency services were called (Yes/No)', category: 'Trackers: Seizure', example: 'No' },
  { name: '{{seizure_notes}}', description: 'Extra seizure notes', category: 'Trackers: Seizure', example: 'Administered midazolam as per plan' },

  // Trackers: Sleep
  { name: '{{sleep_occurred}}', description: 'Whether sleep tracking was recorded (Yes/No)', category: 'Trackers: Sleep', example: 'Yes' },
  { name: '{{sleep_type}}', description: 'Sleep support type', category: 'Trackers: Sleep', example: 'Sleepover' },
  { name: '{{sleep_start_time}}', description: 'Time participant fell asleep', category: 'Trackers: Sleep', example: '21:30' },
  { name: '{{sleep_wake_time}}', description: 'Time participant woke up', category: 'Trackers: Sleep', example: '06:30' },
  { name: '{{sleep_quality}}', description: 'Quality of sleep', category: 'Trackers: Sleep', example: 'Good' },
  { name: '{{sleep_support_required}}', description: 'Sleep support required', category: 'Trackers: Sleep', example: 'Repositioning at 1am' },

  // Trackers: Behaviour
  { name: '{{behaviour_observed}}', description: 'Whether behavior of concern occurred (Yes/No)', category: 'Trackers: Behaviour', example: 'Yes' },
  { name: '{{behaviour_type}}', description: 'Type of behavior', category: 'Trackers: Behaviour', example: 'Vocal agitation' },
  { name: '{{behaviour_intensity}}', description: 'Intensity of behavior', category: 'Trackers: Behaviour', example: 'Medium' },
  { name: '{{behaviour_notes}}', description: 'Behavior tracking notes', category: 'Trackers: Behaviour', example: 'Yelled for 10 minutes' },

  // Trackers: Community Access
  { name: '{{community_access_occurred}}', description: 'Whether community access occurred (Yes/No)', category: 'Trackers: Community Access', example: 'Yes' },
  { name: '{{community_activity_type}}', description: 'Activity type', category: 'Trackers: Community Access', example: 'Shopping' },
  { name: '{{community_location}}', description: 'Location visited', category: 'Trackers: Community Access', example: 'Westfield Mall' },
  { name: '{{community_engagement_level}}', description: 'Engagement level', category: 'Trackers: Community Access', example: 'High' },
  { name: '{{community_notes}}', description: 'Community access notes', category: 'Trackers: Community Access', example: 'Purchased groceries' },

  // Trackers: Nutrition
  { name: '{{meal_provided}}', description: 'Whether nutrition tracking was recorded (Yes/No)', category: 'Trackers: Nutrition', example: 'Yes' },
  { name: '{{nutrition_meal_type}}', description: 'Meal Type', category: 'Trackers: Nutrition', example: 'Breakfast' },
  { name: '{{nutrition_intake}}', description: 'Intake level', category: 'Trackers: Nutrition', example: 'All' },
  { name: '{{nutrition_refusal_alternatives}}', description: 'Alternatives offered if refused', category: 'Trackers: Nutrition', example: 'Offered toast instead of cereal' },
  { name: '{{nutrition_assistance_needed}}', description: 'Assistance level needed', category: 'Trackers: Nutrition', example: 'Verbal prompts' },
  { name: '{{nutrition_fluids_intake}}', description: 'Fluids intake details', category: 'Trackers: Nutrition', example: '250ml water' },
  { name: '{{nutrition_notes}}', description: 'Nutrition notes', category: 'Trackers: Nutrition', example: 'Ate well' },

  // Trackers: Mealtime Management (MTM)
  { name: '{{mtm_meal_provided}}', description: 'Whether MTM tracking was recorded (Yes/No)', category: 'Trackers: Mealtime Management', example: 'Yes' },
  { name: '{{mtm_diet_type}}', description: 'Diet consistency type', category: 'Trackers: Mealtime Management', example: 'Soft & Bite-Sized' },
  { name: '{{mtm_fluids}}', description: 'Fluids consistency type', category: 'Trackers: Mealtime Management', example: 'Mildly Thick (Level 150)' },
  { name: '{{mtm_texture_correct}}', description: 'Texture correct? (Yes/No)', category: 'Trackers: Mealtime Management', example: 'Yes' },
  { name: '{{mtm_consistency_correct}}', description: 'Consistency correct? (Yes/No)', category: 'Trackers: Mealtime Management', example: 'Yes' },
  { name: '{{mtm_positioning_appropriate}}', description: 'Positioning appropriate? (Yes/No)', category: 'Trackers: Mealtime Management', example: 'Yes' },
  { name: '{{mtm_supervision_required}}', description: 'Supervision required? (Yes/No)', category: 'Trackers: Mealtime Management', example: 'Yes' },
  { name: '{{mtm_swallowing_concerns}}', description: 'Swallowing concerns observed', category: 'Trackers: Mealtime Management', example: 'Coughing during fluids' },
  { name: '{{mtm_meal_intake}}', description: 'Meal intake amount', category: 'Trackers: Mealtime Management', example: 'Half' },
  { name: '{{mtm_meal_intake_notes}}', description: 'Meal intake notes', category: 'Trackers: Mealtime Management', example: 'Ate slowly' },
  { name: '{{mtm_fluid_intake}}', description: 'Fluid intake amount', category: 'Trackers: Mealtime Management', example: 'Most' },
  { name: '{{mtm_fluid_intake_notes}}', description: 'Fluid intake notes', category: 'Trackers: Mealtime Management', example: 'Drank through a straw' },
  { name: '{{mtm_concerns}}', description: 'Swallowing/choking concerns description', category: 'Trackers: Mealtime Management', example: 'Mild choking risk' },
  { name: '{{mtm_notes}}', description: 'MTM general notes', category: 'Trackers: Mealtime Management', example: 'Used specialized spoon' },

  // Trackers: Hygiene
  { name: '{{hygiene_support_required}}', description: 'Whether hygiene tracking was recorded (Yes/No)', category: 'Trackers: Hygiene', example: 'Yes' },
  { name: '{{hygiene_shower}}', description: 'Shower support level', category: 'Trackers: Hygiene', example: 'Full assistance' },
  { name: '{{hygiene_oral_care}}', description: 'Oral care support level', category: 'Trackers: Hygiene', example: 'Independent' },
  { name: '{{hygiene_toileting}}', description: 'Toileting support level', category: 'Trackers: Hygiene', example: 'Verbal prompts' },
  { name: '{{hygiene_grooming}}', description: 'Grooming support level', category: 'Trackers: Hygiene', example: 'Assisted hair brushing' },
  { name: '{{hygiene_observed_concerns}}', description: 'Observed hygiene/skin concerns', category: 'Trackers: Hygiene', example: 'Redness on lower back' },
  { name: '{{hygiene_notes}}', description: 'Hygiene notes', category: 'Trackers: Hygiene', example: 'Applied cream' },
];

export function mapShiftNoteToTags(shiftNote: any) {
  if (!shiftNote) return {};

  const formatBool = (val: any) => (val === true ? 'Yes' : 'No');
  const formatDate = (val: any) => val ? new Date(val).toLocaleDateString('en-AU') : '-';

  return {
    reference_id: shiftNote.reference_id || '',
    participant_name: shiftNote.participant?.participant_name || '',
    staff_name: shiftNote.staff?.staff_name || '',
    house_name: shiftNote.house?.house_name || '',
    start_date: formatDate(shiftNote.start_date),
    shift_time: shiftNote.shift_time || '',
    shift_type: shiftNote.shift_type || '',
    overall_presentation: shiftNote.overall_presentation || '',
    notes: shiftNote.notes || '',
    full_note: shiftNote.full_note || '',
    status: shiftNote.status || '',

    // Support Provided
    adl_supports: shiftNote.adl_supports || '',
    domestic_tasks: shiftNote.domestic_tasks || '',
    capacity_building_goals: shiftNote.capacity_building_goals || '',

    // Medications
    regular_medication_status: shiftNote.regular_medication_status || '',
    prn_medication_given: formatBool(shiftNote.prn_medication_given),
    prn_description: shiftNote.prn_description || '',

    // PBS & Restrictive Practices
    pbs_strategies_used: formatBool(shiftNote.pbs_strategies_used),
    pbs_strategies_details: shiftNote.pbs_strategies_details || '',
    pbs_when_used: shiftNote.pbs_when_used || '',
    pbs_outcome: shiftNote.pbs_outcome || '',
    restrictive_practices_status: shiftNote.restrictive_practices_status || '',

    // Risks Observed
    risks_observed: formatBool(shiftNote.risks_observed),
    risk_description: shiftNote.risk_description || '',

    // Trackers: Bowel
    bowel_movement_occurred: formatBool(shiftNote.bowel_movement_occurred),
    bowel_time: shiftNote.bowel_time || '',
    bowel_bristol_scale: shiftNote.bowel_bristol_scale?.toString() || '',
    bowel_amount: shiftNote.bowel_amount?.name || '',
    bowel_assistance: shiftNote.bowel_assistance?.name || '',
    bowel_notes: shiftNote.bowel_notes || '',

    // Trackers: Seizure
    seizure_occurred: formatBool(shiftNote.seizure_occurred),
    seizure_time_started: shiftNote.seizure_time_started || '',
    seizure_duration_minutes: shiftNote.seizure_duration_minutes?.toString() || '',
    seizure_type: shiftNote.seizure_type?.name || '',
    seizure_description: shiftNote.seizure_description || '',
    seizure_injury_occurred: formatBool(shiftNote.seizure_injury_occurred),
    seizure_injury_description: shiftNote.seizure_injury_description || '',
    seizure_emergency_services: formatBool(shiftNote.seizure_emergency_services),
    seizure_notes: shiftNote.seizure_notes || '',

    // Trackers: Sleep
    sleep_occurred: formatBool(shiftNote.sleep_occurred),
    sleep_type: shiftNote.sleep_type?.name || '',
    sleep_start_time: shiftNote.sleep_start_time || '',
    sleep_wake_time: shiftNote.sleep_wake_time || '',
    sleep_quality: shiftNote.sleep_quality?.name || '',
    sleep_support_required: shiftNote.sleep_support_required || '',

    // Trackers: Behaviour
    behaviour_observed: formatBool(shiftNote.behaviour_observed),
    behaviour_type: shiftNote.behaviour_type?.name || '',
    behaviour_intensity: shiftNote.behaviour_intensity?.name || '',
    behaviour_notes: shiftNote.behaviour_notes || '',

    // Trackers: Community Access
    community_access_occurred: formatBool(shiftNote.community_access_occurred),
    community_activity_type: shiftNote.community_activity_type || '',
    community_location: shiftNote.community_location || '',
    community_engagement_level: shiftNote.community_engagement_level || '',
    community_notes: shiftNote.community_notes || '',

    // Trackers: Nutrition
    meal_provided: formatBool(shiftNote.meal_provided),
    nutrition_meal_type: shiftNote.nutrition_meal_type?.name || '',
    nutrition_intake: shiftNote.nutrition_intake?.name || '',
    nutrition_refusal_alternatives: shiftNote.nutrition_refusal_alternatives || '',
    nutrition_assistance_needed: shiftNote.nutrition_assistance_needed || '',
    nutrition_fluids_intake: shiftNote.nutrition_fluids_intake || '',
    nutrition_notes: shiftNote.nutrition_notes || '',

    // Trackers: Mealtime Management
    mtm_meal_provided: formatBool(shiftNote.mtm_meal_provided),
    mtm_diet_type: shiftNote.mtm_diet_type?.name || '',
    mtm_fluids: shiftNote.mtm_fluids?.name || '',
    mtm_texture_correct: formatBool(shiftNote.mtm_texture_correct),
    mtm_consistency_correct: formatBool(shiftNote.mtm_consistency_correct),
    mtm_positioning_appropriate: formatBool(shiftNote.mtm_positioning_appropriate),
    mtm_supervision_required: formatBool(shiftNote.mtm_supervision_required),
    mtm_swallowing_concerns: shiftNote.mtm_swallowing_concerns?.name || '',
    mtm_meal_intake: shiftNote.mtm_meal_intake?.name || '',
    mtm_meal_intake_notes: shiftNote.mtm_meal_intake_notes || '',
    mtm_fluid_intake: shiftNote.mtm_fluid_intake?.name || '',
    mtm_fluid_intake_notes: shiftNote.mtm_fluid_intake_notes || '',
    mtm_concerns: shiftNote.mtm_concerns || '',
    mtm_notes: shiftNote.mtm_notes || '',

    // Trackers: Hygiene
    hygiene_support_required: formatBool(shiftNote.hygiene_support_required),
    hygiene_shower: shiftNote.hygiene_shower?.name || '',
    hygiene_oral_care: shiftNote.hygiene_oral_care?.name || '',
    hygiene_toileting: shiftNote.hygiene_toileting?.name || '',
    hygiene_grooming: shiftNote.hygiene_grooming?.name || '',
    hygiene_observed_concerns: shiftNote.hygiene_observed_concerns || '',
    hygiene_notes: shiftNote.hygiene_notes || '',
  };
}
