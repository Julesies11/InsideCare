import { useMemo } from 'react';
import { StaffPendingChanges } from '@/models/staff-pending-changes';

interface UseStaffOnboardingStateProps {
  summary: any[];
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
}

export function useStaffOnboardingState({
  summary,
  pendingChanges,
  onPendingChangesChange,
}: UseStaffOnboardingStateProps) {
  const resolvedItems = useMemo(() => {
    const toUpsertMap = new Map(
      pendingChanges?.onboarding?.toUpsert.map((c) => [
        c.onboarding_item_id,
        c,
      ]),
    );
    const toDeleteSet = new Set(
      pendingChanges?.onboarding?.toDelete || [],
    );

    return summary.map((row) => {
      const itemId = row.item_id;
      const pendingUpsert = toUpsertMap.get(itemId);
      const isPendingDelete = row.record_id
        ? toDeleteSet.has(row.record_id)
        : false;

      let isComplete = row.is_complete || false;
      let comments = row.comments || '';

      if (pendingUpsert) {
        isComplete = pendingUpsert.is_complete;
        comments = pendingUpsert.comments || '';
      }

      return {
        itemId,
        recordId: row.record_id,
        itemName: row.item_name,
        description: row.description,
        isComplete,
        comments,
        isPendingDelete,
        isPendingUpsert: !!pendingUpsert,
        updatedAt: row.updated_at,
      };
    });
  }, [
    summary,
    pendingChanges?.onboarding?.toUpsert,
    pendingChanges?.onboarding?.toDelete,
  ]);

  const toggleComplete = (itemId: string, recordId: string | null, currentVal: boolean) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newVal = !currentVal;
    
    // Peer Review Correction: If newVal is FALSE and comments are empty, and it exists in DB,
    // we should prepare it for deletion to prevent database bloat (Gold Standard).
    const row = summary.find(r => r.item_id === itemId);
    const hasComments = !!(pendingChanges.onboarding.toUpsert.find(c => c.onboarding_item_id === itemId)?.comments || row?.comments);

    if (!newVal && !hasComments && recordId) {
      // Remove from toUpsert if it was there
      const toUpsert = pendingChanges.onboarding.toUpsert.filter(c => c.onboarding_item_id !== itemId);
      // Add to toDelete
      const toDelete = [...new Set([...pendingChanges.onboarding.toDelete, recordId])];

      onPendingChangesChange({
        ...pendingChanges,
        onboarding: {
          ...pendingChanges.onboarding,
          toUpsert,
          toDelete,
        },
      });
      return;
    }

    // Otherwise, standard upsert
    const existingUpsert = pendingChanges.onboarding.toUpsert.find(
      (c) => c.onboarding_item_id === itemId,
    );

    let toUpsert = [];
    if (existingUpsert) {
      toUpsert = pendingChanges.onboarding.toUpsert.map((c) =>
        c.onboarding_item_id === itemId ? { ...c, is_complete: newVal } : c,
      );
    } else {
      toUpsert = [
        ...pendingChanges.onboarding.toUpsert,
        {
          id: recordId || undefined,
          onboarding_item_id: itemId,
          is_complete: newVal,
          comments: row?.comments || '',
        },
      ];
    }
    
    // Remove from toDelete if it was there
    const toDelete = pendingChanges.onboarding.toDelete.filter(id => id !== recordId);

    onPendingChangesChange({
      ...pendingChanges,
      onboarding: {
        ...pendingChanges.onboarding,
        toUpsert,
        toDelete,
      },
    });
  };

  const updateComments = (itemId: string, recordId: string | null, value: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // Peer Review Correction: Handle deletion if comments are cleared and item is not complete
    const row = summary.find(r => r.item_id === itemId);
    const isComplete = !!(pendingChanges.onboarding.toUpsert.find(c => c.onboarding_item_id === itemId)?.is_complete ?? row?.is_complete);

    if (!value && !isComplete && recordId) {
      const toUpsert = pendingChanges.onboarding.toUpsert.filter(c => c.onboarding_item_id !== itemId);
      const toDelete = [...new Set([...pendingChanges.onboarding.toDelete, recordId])];
      
      onPendingChangesChange({
        ...pendingChanges,
        onboarding: {
          ...pendingChanges.onboarding,
          toUpsert,
          toDelete,
        },
      });
      return;
    }

    const existingUpsert = pendingChanges.onboarding.toUpsert.find(
      (c) => c.onboarding_item_id === itemId,
    );

    let toUpsert = [];
    if (existingUpsert) {
      toUpsert = pendingChanges.onboarding.toUpsert.map((c) =>
        c.onboarding_item_id === itemId ? { ...c, comments: value } : c,
      );
    } else {
      toUpsert = [
        ...pendingChanges.onboarding.toUpsert,
        {
          id: recordId || undefined,
          onboarding_item_id: itemId,
          is_complete: isComplete,
          comments: value,
        },
      ];
    }
    
    const toDelete = pendingChanges.onboarding.toDelete.filter(id => id !== recordId);

    onPendingChangesChange({
      ...pendingChanges,
      onboarding: {
        ...pendingChanges.onboarding,
        toUpsert,
        toDelete,
      },
    });
  };

  return {
    resolvedItems,
    toggleComplete,
    updateComments,
  };
}
