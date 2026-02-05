import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';

export function ParticipantDetailSidebar() {
  const items: ScrollspyMenuItems = [
    {
      title: 'Personal Details',
      target: 'personal_details',
      active: true,
    },
    {
      title: 'Goals',
      target: 'goals',
    },
    {
      title: 'Behaviour & Support',
      target: 'behaviour',
    },
    {
      title: 'Support Needs',
      target: 'support-needs',
      children: [
        {
          title: 'Personal Care and Routine',
          target: 'support-needs-personal-care',
        },
        {
          title: 'Mobility',
          target: 'support-needs-mobility',
        },
        {
          title: 'Meal Preparation',
          target: 'support-needs-meal-prep',
        },
        {
          title: 'Household Tasks',
          target: 'support-needs-household',
        },
        {
          title: 'Communication',
          target: 'support-needs-communication',
        },
        {
          title: 'Finances',
          target: 'support-needs-finances',
        },
        {
          title: 'Health and Wellbeing',
          target: 'support-needs-health',
        },
        {
          title: 'Cultural and Religious',
          target: 'support-needs-cultural',
        },
        {
          title: 'Other',
          target: 'support-needs-other',
        },
      ],
    },
    {
      title: 'Mealtime Management',
      target: 'mealtime',
    },
    {
      title: 'Medical Routine',
      target: 'medical-routine',
      children: [
        {
          title: 'Pharmacy',
          target: 'medical-routine-pharmacy',
        },
        {
          title: 'General Practitioner',
          target: 'medical-routine-gp',
        },
        {
          title: 'Psychiatrist',
          target: 'medical-routine-psychiatrist',
        },
      ],
    },
    {
      title: 'Emergency Management',
      target: 'emergency-management',
    },
    {
      title: 'Contacts',
      target: 'providers',
    },
    {
      title: 'Documents',
      target: 'documents',
    },
    {
      title: 'Shift Notes',
      target: 'shift_notes',
    },
    {
      title: 'Activity Log',
      target: 'activity_log',
    },
  ];

  return <ScrollspyMenu items={items} />;
}
