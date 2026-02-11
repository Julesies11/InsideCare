import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';

export function StaffDetailSidebar() {
  const items: ScrollspyMenuItems = [
    {
      title: 'Personal Details',
      target: 'personal_details',
      active: true,
    },
    {
      title: 'Employment Details',
      target: 'employment_details',
    },
    {
      title: 'Availability',
      target: 'staff_availability',
    },
    {
      title: 'Emergency Contact',
      target: 'emergency_contact',
    },
    {
      title: 'Compliance',
      target: 'staff_compliance',
    },
    {
      title: 'Training',
      target: 'staff_training',
    },
    {
      title: 'Documents',
      target: 'staff_documents',
    },
    {
      title: 'Roster',
      target: 'staff_roster',
    },
    {
      title: 'Leave',
      target: 'staff_leave',
    },
    {
      title: 'Warnings',
      target: 'staff_warnings',
    },
    {
      title: 'Activity Log',
      target: 'staff_activity_log',
    },
  ];

  return <ScrollspyMenu items={items} />;
}
