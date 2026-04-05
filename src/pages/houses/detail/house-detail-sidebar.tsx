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
      title: 'House Management',
      target: 'house_management',
      children: [
        {
          title: 'Participants',
          target: 'house_participants',
        },
        {
          title: 'House Details',
          target: 'house_management_details',
        },
      ]
    },
    {
      title: 'Calendar',
      target: 'calendar_events',
    },
    {
      title: 'Shift Configuration',
      target: 'shift_configuration',
    },
    {
      title: 'Checklist/Comms',
      target: 'checklist_comms_section',
      children: [
        {
          title: 'Daily Comms',
          target: 'house_comms',
        },
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
      title: 'Resources',
      target: 'resources',
    },
    {
      title: 'Staff',
      target: 'staff',
    },
    {
      title: 'Activity Log',
      target: 'activity_log',
    },
  ];

  return <ScrollspyMenu items={items} />;
}
