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
      title: 'Medical & Allergies',
      target: 'medical',
    },
    {
      title: 'Hygiene & Routines',
      target: 'hygiene',
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
      title: 'Notes',
      target: 'notes',
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
