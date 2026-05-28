import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';

interface ShiftNoteDetailSidebarProps {
  formData: Record<string, unknown> | null;
}

export function ShiftNoteDetailSidebar({ formData }: ShiftNoteDetailSidebarProps) {
  const items: ScrollspyMenuItems = [
    {
      title: 'Overview',
      target: 'shift_note_overview',
      active: true,
    },
    {
      title: 'Supports',
      target: 'shift_note_supports',
    },
    {
      title: 'Health & Medication',
      target: 'shift_note_health',
    },
    {
      title: 'Trackers',
      target: 'shift_note_trackers',
      children: [
        { title: 'Bowel Tracking', target: 'tracker_bowel', hidden: !formData?.bowel_movement_occurred },
        { title: 'Seizure Activity', target: 'tracker_seizure', hidden: !formData?.seizure_occurred },
        { title: 'Sleep Tracking', target: 'tracker_sleep', hidden: !formData?.sleep_occurred },
        { title: 'Behaviour Observation', target: 'tracker_behaviour', hidden: !formData?.behaviour_observed },
        { title: 'Community Participation', target: 'tracker_community', hidden: !formData?.community_access_occurred },
        { title: 'Nutrition Tracker', target: 'tracker_nutrition', hidden: !formData?.meal_provided },
        { title: 'Mealtime Management', target: 'tracker_mtm', hidden: !formData?.mtm_meal_provided },
        { title: 'Hygiene Tracking', target: 'tracker_hygiene', hidden: !formData?.hygiene_support_required },
      ]
    },
    {
      title: 'Summary',
      target: 'shift_note_summary',
    },
  ];

  // Filter out hidden tracker sub-children for cleaner menu
  const processedItems = items.map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => !child.hidden)
      };
    }
    return item;
  });

  return <ScrollspyMenu items={processedItems} />;
}
