import { useCallback, useEffect, useState } from 'react';
import { checklistsApi } from '@/api/checklists.api';
import { useAuth } from '@/auth/context/auth-context';
import { HouseChecklistExecution } from '@/pages/houses/detail/components/house-checklist-execution';
import { PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CHECKLIST_STATUS } from '@/config/enums';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChecklistExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: {
    id: string;
    name: string;
    master_id?: string;
    items?: Array<{
      id: string;
      title: string;
      is_required?: boolean;
      master_item_id?: string;
    }>;
  };
  houseId: string;
  onSuccess?: () => void;
}

/**
 * Reusable Dialog for executing a checklist.
 * Handles fetching existing drafts, saving progress, and completion.
 */
export function ChecklistExecutionDialog({
  open,
  onOpenChange,
  checklist,
  houseId,
  onSuccess,
}: ChecklistExecutionDialogProps) {
  const { user } = useAuth();
  const [activeSubmission, setActiveSubmission] = useState<{
    id: string;
    completedItems: Record<string, boolean>;
    itemNotes: Record<string, string>;
    attachments: Record<string, any[]>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDraft = useCallback(async () => {
    setLoading(true);
    try {
      const data = await checklistsApi.getDraftSubmission(
        checklist.id,
        houseId,
      );

      if (data) {
        const completedItems: Record<string, boolean> = {};
        const itemNotes: Record<string, string> = {};
        const completedBy: Record<string, { id: string; name: string }> = {};

        const submissionItems =
          (data as any).ic_house_checklist_submission_items || [];
        submissionItems.forEach((item: any) => {
          const isDone =
            item.status === CHECKLIST_STATUS.COMPLETED || item.is_completed;
          completedItems[item.item_id] = isDone;
          itemNotes[item.item_id] = item.note || '';
          if (isDone && item.completed_by_staff) {
            completedBy[item.item_id] = {
              id: item.completed_by_staff.id,
              name: item.completed_by_staff.staff_name,
            };
          }
        });

        // Fetch existing attachments
        const attachmentData = await checklistsApi.getSubmissionAttachments(
          data.id,
        );

        const attachments: Record<string, any[]> = {};
        if (attachmentData) {
          for (const att of attachmentData) {
            if (!attachments[att.item_id]) attachments[att.item_id] = [];
            try {
              const signedUrl = await checklistsApi.getAttachmentSignedUrl(
                att.file_path,
                att.file_name,
              );
              attachments[att.item_id].push({ ...att, file_path: signedUrl });
            } catch (urlError) {
              console.error(
                'Error creating signed URL for attachment:',
                urlError,
              );
            }
          }
        }

        setActiveSubmission({
          id: data.id,
          completedItems,
          itemNotes,
          completedBy,
          attachments,
        });
      }
    } catch (error) {
      console.error('Error fetching draft:', error);
    } finally {
      setLoading(false);
    }
  }, [checklist.id, houseId]);

  // Fetch draft when checklist changes or dialog opens
  useEffect(() => {
    if (open && checklist && houseId) {
      fetchDraft();
    } else {
      setActiveSubmission(null);
    }
  }, [open, checklist, houseId, fetchDraft]);

  const persistExecution = async (
    results: {
      checklist_id: string;
      items: Array<{
        item_id: string;
        is_completed: boolean;
        note: string;
      }>;
      toDeleteAttachments?: string[];
      queuedAttachments?: Record<string, Array<{ file: File }>>;
    },
    status: 'in_progress' | 'completed',
  ) => {
    const staffId = user?.staff_id;
    let submissionId = activeSubmission?.id;

    if (!submissionId) {
      const data = await checklistsApi.upsertSubmission({
        checklist_id: results.checklist_id,
        house_id: houseId,
        master_id: checklist?.master_id || null,
        submitted_by: staffId || null,
        status: status as any,
        completed_at:
          status === CHECKLIST_STATUS.completed
            ? new Date().toISOString()
            : null,
      });
      if (!data)
        throw new Error('You do not have permission to perform this action');
      submissionId = data.id;
    } else {
      await checklistsApi.upsertSubmission(
        {
          status: status as any,
          submitted_by: staffId || null,
          completed_at:
            status === CHECKLIST_STATUS.completed
              ? new Date().toISOString()
              : null,
        },
        submissionId,
      );
    }

    const submissionItems = results.items.map((item) => {
      const originalItem = checklist?.items?.find((i) => i.id === item.item_id);
      return {
        submission_id: submissionId,
        item_id: item.item_id,
        master_item_id: originalItem?.master_item_id || null,
        is_completed: item.is_completed,
        status: item.is_completed
          ? CHECKLIST_STATUS.COMPLETED
          : CHECKLIST_STATUS.PENDING,
        completed_by: (item as any).completed_by,
        note: item.note,
        completed_at: item.is_completed ? new Date().toISOString() : null,
      };
    });
    await checklistsApi.upsertSubmissionItems(submissionItems);

    if (results.toDeleteAttachments && results.toDeleteAttachments.length > 0) {
      for (const attId of results.toDeleteAttachments) {
        await checklistsApi.deleteAttachment(attId);
      }
    }

    if (results.queuedAttachments) {
      for (const itemId in results.queuedAttachments) {
        for (const queued of results.queuedAttachments[itemId]) {
          await checklistsApi.uploadAttachment(
            submissionId!,
            itemId,
            queued.file,
            staffId,
          );
        }
      }
    }

    return submissionId;
  };

  const handleSave = async (results: {
    checklist_id: string;
    items: Array<{
      item_id: string;
      is_completed: boolean;
      note: string;
    }>;
    toDeleteAttachments?: string[];
    queuedAttachments?: Record<string, Array<{ file: File }>>;
  }) => {
    try {
      const id = await persistExecution(results, CHECKLIST_STATUS.in_progress);
      if (!activeSubmission) {
        const completedItems: Record<string, boolean> = {};
        const itemNotes: Record<string, string> = {};
        results.items.forEach((item) => {
          completedItems[item.item_id] = item.is_completed;
          itemNotes[item.item_id] = item.note || '';
        });
        setActiveSubmission({ id, completedItems, itemNotes, attachments: {} });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save progress');
    }
  };

  const handleComplete = async (results: {
    checklist_id: string;
    items: Array<{
      item_id: string;
      is_completed: boolean;
      note: string;
    }>;
    toDeleteAttachments?: string[];
    queuedAttachments?: Record<string, Array<{ file: File }>>;
  }) => {
    try {
      await persistExecution(results, CHECKLIST_STATUS.completed);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Completion failed:', error);
      toast.error('Failed to complete checklist');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-h-[500px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PlayCircle className="size-5 text-primary" />
            {checklist?.house_checklist_name || checklist?.name}
          </DialogTitle>
          <DialogDescription>
            Complete the required items and save your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-hidden">
          {checklist && !loading && (
            <HouseChecklistExecution
              checklist={checklist}
              onComplete={handleComplete}
              onSave={handleSave}
              onCancel={() => onOpenChange(false)}
              initialData={
                activeSubmission
                  ? {
                      completedItems: activeSubmission.completedItems,
                      itemNotes: activeSubmission.itemNotes,
                      attachments: activeSubmission.attachments,
                    }
                  : undefined
              }
            />
          )}
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-sm text-muted-foreground animate-pulse">
                Loading checklist details...
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
