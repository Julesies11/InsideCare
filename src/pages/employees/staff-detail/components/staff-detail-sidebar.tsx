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
      title: 'Emergency Contact',
      target: 'emergency_contact',
    },
    {
      title: 'Additional Information',
      target: 'additional_info',
    },
    {
      title: 'Compliance & Training',
      target: 'staff_compliance',
    },
    {
      title: 'Resources',
      target: 'staff_resources',
    },
    {
      title: 'Activity Log',
      target: 'staff_activity_log',
    },
  ];

  return <ScrollspyMenu items={items} />;
}
