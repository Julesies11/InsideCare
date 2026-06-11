import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStaffOnboardingState } from './use-staff-onboarding-state';
import { emptyStaffPendingChanges } from '@/models/staff-pending-changes';

describe('useStaffOnboardingState', () => {
  const mockSummary = [
    {
      item_id: 'item-1',
      item_name: 'Task 1',
      is_complete: false,
      comments: '',
      record_id: 'record-1',
    },
    {
      item_id: 'item-2',
      item_name: 'Task 2',
      is_complete: true,
      comments: 'Existing comment',
      record_id: 'record-2',
    },
  ];

  it('should resolve items correctly from summary', () => {
    const { result } = renderHook(() =>
      useStaffOnboardingState({
        summary: mockSummary,
        pendingChanges: emptyStaffPendingChanges,
      }),
    );

    expect(result.current.resolvedItems).toHaveLength(2);
    expect(result.current.resolvedItems[0].itemName).toBe('Task 1');
    expect(result.current.resolvedItems[1].isComplete).toBe(true);
  });

  it('should handle toggleComplete by adding to toUpsert', () => {
    const onPendingChangesChange = vi.fn();
    const { result } = renderHook(() =>
      useStaffOnboardingState({
        summary: mockSummary,
        pendingChanges: emptyStaffPendingChanges,
        onPendingChangesChange,
      }),
    );

    act(() => {
      result.current.toggleComplete('item-1', 'record-1', false);
    });

    expect(onPendingChangesChange).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding: {
          toUpsert: [
            expect.objectContaining({
              onboarding_item_id: 'item-1',
              is_complete: true,
            }),
          ],
          toDelete: [],
        },
      }),
    );
  });

  it('should handle deletion when unchecking item with no comments (Gold Standard)', () => {
    const onPendingChangesChange = vi.fn();
    const { result } = renderHook(() =>
      useStaffOnboardingState({
        summary: mockSummary,
        pendingChanges: emptyStaffPendingChanges,
        onPendingChangesChange,
      }),
    );

    act(() => {
      // Unchecking 'item-1' (which has record_id 'record-1' and no comments)
      result.current.toggleComplete('item-1', 'record-1', true);
    });

    expect(onPendingChangesChange).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding: {
          toUpsert: [],
          toDelete: ['record-1'],
        },
      }),
    );
  });
});
