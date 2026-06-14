import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ShiftNoteDetailSidebar } from './shift-note-detail-sidebar';

// Mock ScrollspyMenu to simplify testing
vi.mock('@/partials/navbar/scrollspy-menu', () => ({
  ScrollspyMenu: ({ items }: { items: any[] }) => (
    <div data-testid="scrollspy-menu">
      {items.map((item) => (
        <div key={item.target} data-testid={`item-${item.target}`}>
          {item.title}
          {item.children && (
            <div data-testid={`children-${item.target}`}>
              {item.children.map((child: any) => (
                <div key={child.target} data-testid={`child-${child.target}`}>
                  {child.title}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  ),
}));

describe('ShiftNoteDetailSidebar', () => {
  const mockFormData = {
    participant: {
      track_bowel: true,
      track_seizure: false,
      track_sleep: true,
      track_behaviour: false,
      track_community: true,
      track_nutrition: false,
      track_mtm: true,
      track_hygiene: false,
    },
  };

  it('renders sidebar items based on participant tracking preferences', () => {
    render(
      <MemoryRouter>
        <ShiftNoteDetailSidebar formData={mockFormData as any} />
      </MemoryRouter>,
    );

    // Core items should always be there
    expect(screen.getByTestId('item-shift_note_overview')).toBeDefined();
    expect(screen.getByTestId('item-shift_note_supports')).toBeDefined();
    expect(screen.getByTestId('item-shift_note_health')).toBeDefined();
    expect(screen.getByTestId('item-shift_note_trackers')).toBeDefined();
    expect(screen.getByTestId('item-shift_note_summary')).toBeDefined();

    // Check visibility of specific trackers
    expect(screen.queryByTestId('child-tracker_bowel')).not.toBeNull();
    expect(screen.queryByTestId('child-tracker_sleep')).not.toBeNull();
    expect(screen.queryByTestId('child-tracker_community')).not.toBeNull();
    expect(screen.queryByTestId('child-tracker_mtm')).not.toBeNull();

    // These should be hidden because track_* is false
    expect(screen.queryByTestId('child-tracker_seizure')).toBeNull();
    expect(screen.queryByTestId('child-tracker_behaviour')).toBeNull();
    expect(screen.queryByTestId('child-tracker_nutrition')).toBeNull();
    expect(screen.queryByTestId('child-tracker_hygiene')).toBeNull();
  });

  it('handles null formData gracefully', () => {
    render(
      <MemoryRouter>
        <ShiftNoteDetailSidebar formData={null} />
      </MemoryRouter>,
    );

    // Should still render parent items but with no children (as hidden is true by default if participant is missing)
    expect(screen.getByTestId('item-shift_note_trackers')).toBeDefined();
    const childrenContainer = screen.getByTestId('children-shift_note_trackers');
    expect(childrenContainer.children.length).toBe(0);
  });
});
