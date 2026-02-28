import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';

export function HouseDetailSidebar() {
  const items: ScrollspyMenuItems = [
    {
      title: 'House Details',
      target: 'house_details',
      active: true,
    },
    {
      title: 'Staff',
      target: 'staff',
    },
    {
      title: 'Calendar Events',
      target: 'calendar_events',
    },
    {
      title: 'Documents',
      target: 'documents',
    },
    {
      title: 'Checklists',
      target: 'checklists_section',
      children: [
        {
          title: 'Checklist Setup',
          target: 'checklists',
        },
        {
          title: 'Checklist History',
          target: 'checklist_history',
        },
      ]
    },
    {
      title: 'Forms',
      target: 'forms',
    },
    {
      title: 'Resources',
      target: 'resources',
    },
    {
      title: 'Participants',
      target: 'participants',
    },
  ];

  return <ScrollspyMenu items={items} />;
}
