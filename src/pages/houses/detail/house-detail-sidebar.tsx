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
          title: 'Breakdown of Individuals',
          target: 'house_individuals_breakdown',
        },
        {
          title: 'Dynamics within Participants',
          target: 'house_participant_dynamics',
        },
        {
          title: 'Observations',
          target: 'house_observations',
        },
        {
          title: 'General House Details',
          target: 'house_general_details',
        },
      ]
    },
    {
      title: 'Calendar',
      target: 'calendar_events',
    },
    {
      title: 'Shift Setup',
      target: 'shift_templates',
      children: [
        {
          title: 'Shift Templates',
          target: 'shift_templates',
        },
        {
          title: 'Daily Comms',
          target: 'house_comms',
        },
      ]
    },
    {
      title: 'Checklist Setup',
      target: 'checklist_comms_section',
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
