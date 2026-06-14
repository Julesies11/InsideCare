import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';

interface ShiftNoteDetailSidebarProps {
  formData: Record<string, unknown> | null;
}

export function ShiftNoteDetailSidebar({
  formData,
}: ShiftNoteDetailSidebarProps) {
  const items: ScrollspyMenuItems = [
    {
      title: 'Overview',
      target: 'shift_note_overview',
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
        {
          title: 'Bowel Tracking',
          target: 'tracker_bowel',
          hidden: !(formData?.participant as any)?.track_bowel,
        },
        {
          title: 'Seizure Activity',
          target: 'tracker_seizure',
          hidden: !(formData?.participant as any)?.track_seizure,
        },
        {
          title: 'Sleep Tracking',
          target: 'tracker_sleep',
          hidden: !(formData?.participant as any)?.track_sleep,
        },
        {
          title: 'Behaviour Observation',
          target: 'tracker_behaviour',
          hidden: !(formData?.participant as any)?.track_behaviour,
        },
        {
          title: 'Community Participation',
          target: 'tracker_community',
          hidden: !(formData?.participant as any)?.track_community,
        },
        {
          title: 'Nutrition Tracker',
          target: 'tracker_nutrition',
          hidden: !(formData?.participant as any)?.track_nutrition,
        },
        {
          title: 'Mealtime Management',
          target: 'tracker_mtm',
          hidden: !(formData?.participant as any)?.track_mtm,
        },
        {
          title: 'Hygiene Tracking',
          target: 'tracker_hygiene',
          hidden: !(formData?.participant as any)?.track_hygiene,
        },
      ],
    },
    {
      title: 'Summary',
      target: 'shift_note_summary',
    },
  ];

  // Process items: filter out hidden children
  const processedItems = items.map((item) => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter((child) => !child.hidden),
      };
    }
    return item;
  });

  return <ScrollspyMenu items={processedItems} />;
}
