import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayCircle } from 'lucide-react';
import { HouseChecklistExecution } from '@/pages/houses/detail/components/house-checklist-execution';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';

interface ChecklistExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: any;
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
  onSuccess 
}: ChecklistExecutionDialogProps) {
  const { user } = useAuth();
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch draft when checklist changes or dialog opens
  useEffect(() => {
    if (open && checklist && houseId) {
      fetchDraft();
    } else {
      setActiveSubmission(null);
    }
  }, [open, checklist?.id, houseId]);

  const fetchDraft = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('house_checklist_submissions')
        .select(`
          *,
          house_checklist_submission_items (*)
        `)
        .eq('checklist_id', checklist.id)
        .eq('house_id', houseId)
        .eq('status', 'in_progress')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const completedItems: Record<string, boolean> = {};
        const itemNotes: Record<string, string> = {};
        data.house_checklist_submission_items.forEach((item: any) => {
          completedItems[item.item_id] = item.is_completed;
          itemNotes[item.item_id] = item.note || '';
        });

        // Fetch existing attachments
        const { data: attachmentData } = await supabase
          .from('house_checklist_item_attachments')
          .select('*')
          .eq('submission_id', data.id);

        const attachments: Record<string, any[]> = {};
        if (attachmentData) {
          attachmentData.forEach(att => {
            if (!attachments[att.item_id]) attachments[att.item_id] = [];
            const { data: urlData } = supabase.storage.from('checklist-attachments').getPublicUrl(att.file_path);
            attachments[att.item_id].push({ ...att, file_path: urlData.publicUrl });
          });
        }

        setActiveSubmission({ id: data.id, completedItems, itemNotes, attachments });
      }
    } catch (error) {
      console.error('Error fetching draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const persistExecution = async (results: any, status: 'in_progress' | 'completed') => {
    const staffId = user?.staff_id;
    let submissionId = activeSubmission?.id;

    if (!submissionId) {
      const { data, error } = await supabase
        .from('house_checklist_submissions')
        .insert({
          checklist_id: results.checklist_id,
          house_id: houseId,
          master_id: checklist?.master_id || null,
          submitted_by: staffId || null,
          status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .select().single();
      if (error) throw error;
      submissionId = data.id;
    } else {
      const { error } = await supabase
        .from('house_checklist_submissions')
        .update({
          status: status,
          submitted_by: staffId || null,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      if (error) throw error;
    }

    const submissionItems = results.items.map((item: any) => {
      const originalItem = checklist?.items?.find((i: any) => i.id === item.item_id);
      return {
        submission_id: submissionId,
        item_id: item.item_id,
        master_item_id: originalItem?.master_item_id || null,
        is_completed: item.is_completed,
        note: item.note,
        completed_at: item.is_completed ? new Date().toISOString() : null
      };
    });
    await supabase.from('house_checklist_submission_items').upsert(submissionItems, { onConflict: 'submission_id,item_id' });

    if (results.toDeleteAttachments?.length > 0) {
      for (const attId of results.toDeleteAttachments) {
        const { data: att } = await supabase.from('house_checklist_item_attachments').select('file_path').eq('id', attId).single();
        if (att?.file_path) await supabase.storage.from('checklist-attachments').remove([att.file_path]);
        await supabase.from('house_checklist_item_attachments').delete().eq('id', attId);
      }
    }

    if (results.queuedAttachments) {
      for (const itemId in results.queuedAttachments) {
        for (const queued of results.queuedAttachments[itemId]) {
          const filePath = `${submissionId}/${itemId}/${Date.now()}-${queued.file.name}`;
          await supabase.storage.from('checklist-attachments').upload(filePath, queued.file);
          await supabase.from('house_checklist_item_attachments').insert({
            submission_id: submissionId,
            item_id: itemId,
            file_name: queued.file.name,
            file_path: filePath,
            file_size: queued.file.size,
            mime_type: queued.file.type,
            uploaded_by: staffId || null
          });
        }
      }
    }

    return submissionId;
  };

  const handleSave = async (results: any) => {
    try {
      const id = await persistExecution(results, 'in_progress');
      if (!activeSubmission) {
        const completedItems: Record<string, boolean> = {};
        const itemNotes: Record<string, string> = {};
        results.items.forEach((item: any) => {
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

  const handleComplete = async (results: any) => {
    try {
      await persistExecution(results, 'completed');
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
            {checklist?.name}
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
              initialData={activeSubmission ? {
                completedItems: activeSubmission.completedItems,
                itemNotes: activeSubmission.itemNotes,
                attachments: activeSubmission.attachments
              } : undefined}
            />
          )}
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-sm text-muted-foreground animate-pulse">Loading checklist details...</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
