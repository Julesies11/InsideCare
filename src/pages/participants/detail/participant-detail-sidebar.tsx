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
      title: 'Clinical Details',
      target: 'clinical',
    },
    {
      title: 'Behaviour & Support',
      target: 'behaviour',
    },
    {
      title: 'Mealtime Management',
      target: 'mealtime',
    },
    {
      title: 'Support Needs',
      target: 'support-needs',
    },
    {
      title: 'Emergency Management',
      target: 'emergency-management',
    },
    {
      title: 'Medical Routine',
      target: 'medical-routine',
    },
    {
      title: 'Goals',
      target: 'goals',
    },
    {
      title: 'Documents',
      target: 'documents',
    },
    {
      title: 'Medications',
      target: 'medications',
    },
    {
      title: 'Service Providers',
      target: 'providers',
    },
    {
      title: 'Restrictive Practices',
      target: 'practices',
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
