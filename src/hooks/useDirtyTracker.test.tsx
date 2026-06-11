import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDirtyTracker } from './useDirtyTracker';

describe('useDirtyTracker', () => {
  const originalData = { name: 'Original', address: '123 St' };
  const changedData = { name: 'Updated', address: '123 St' };

  it('should return isDirty: false when data matches and no pending changes', () => {
    const { result } = renderHook(() =>
      useDirtyTracker({
        formData: originalData,
        originalData: originalData,
      }),
    );

    expect(result.current.isDirty).toBe(false);
    expect(result.current.formChanged).toBe(false);
    expect(result.current.hasPendingChildChanges).toBe(false);
  });

  it('should return isDirty: true when formData differs from originalData', () => {
    const { result } = renderHook(() =>
      useDirtyTracker({
        formData: changedData,
        originalData: originalData,
      }),
    );

    expect(result.current.isDirty).toBe(true);
    expect(result.current.formChanged).toBe(true);
  });

  it('should detect staff pending changes', () => {
    const pendingChanges = {
      training: {
        toAdd: [{ title: 'New Training' }],
        toUpdate: [],
        toDelete: [],
      },
      documents: { toAdd: [], toDelete: [] },
      staffCompliance: { toAdd: [], toUpdate: [], toDelete: [] },
      qualifications: { toAdd: [], toUpdate: [], toDelete: [] },
      onboarding: { toUpsert: [], toDelete: [] },
    };

    const { result } = renderHook(() =>
      useDirtyTracker({
        formData: originalData,
        originalData: originalData,
        pendingChanges: pendingChanges as any,
      }),
    );

    expect(result.current.isDirty).toBe(true);
    expect(result.current.hasPendingChildChanges).toBe(true);
  });

  it('should detect house pending changes', () => {
    const pendingChanges = {
      participants: { toAdd: [{ tempId: '1' }], toUpdate: [], toDelete: [] },
      staff: { toAdd: [], toUpdate: [], toDelete: [] },
      calendarEvents: { toAdd: [], toUpdate: [], toDelete: [] },
      documents: { toAdd: [], toDelete: [] },
      checklists: { toAdd: [], toUpdate: [], toDelete: [] },
      formAssignments: { toAdd: [], toDelete: [] },
      resources: { toAdd: [], toUpdate: [], toDelete: [] },
      comms: { toAdd: [], toDelete: [] },
    };

    const { result } = renderHook(() =>
      useDirtyTracker({
        formData: originalData,
        originalData: originalData,
        pendingChanges: pendingChanges as any,
      }),
    );

    expect(result.current.isDirty).toBe(true);
    expect(result.current.hasPendingChildChanges).toBe(true);
  });
});
