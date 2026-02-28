import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  History, 
  Clock, 
  Plus, 
  Search,
  Download,
  FileText,
  Edit,
  Eye
} from 'lucide-react';
import { useChecklistHistory, ChecklistSubmission } from '@/hooks/useChecklistHistory';
import { useHouseChecklists } from '@/hooks/useHouseChecklists';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HouseChecklistExecution } from './house-checklist-execution';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface HouseChecklistHistoryProps {
  houseId?: string;
  canAdd: boolean;
}

export function HouseChecklistHistory({ houseId, canAdd }: HouseChecklistHistoryProps) {
  const { user } = useAuth();
  const { submissions, loading: loadingHistory, refresh: refreshHistory } = useChecklistHistory(houseId);
  const { houseChecklists, loading: loadingChecklists, refresh: refreshChecklists } = useHouseChecklists(houseId);
  
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [executingChecklist, setExecutingChecklist] = useState<any>(null);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = submissions.filter(s => 
    s.checklist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartNew = async (checklist: any) => {
    const existing = submissions.find(s => s.checklist_id === checklist.id && s.status === 'in_progress');
    if (existing) {
      handleResume(existing);
      return;
    }

    setExecutingChecklist(checklist);
    setActiveSubmission(null);
    setShowExecutionDialog(true);
  };

  const handleResume = async (submission: ChecklistSubmission) => {
    const checklist = houseChecklists.find(c => c.id === submission.checklist_id);
    if (!checklist) {
      toast.error('Checklist template not found');
      return;
    }

    try {
      const { data: itemData } = await supabase
        .from('house_checklist_submission_items')
        .select('*')
        .eq('submission_id', submission.id);

      const { data: attachmentData } = await supabase
        .from('house_checklist_item_attachments')
        .select('*')
        .eq('submission_id', submission.id);

      const completedItems: Record<string, boolean> = {};
      const itemNotes: Record<string, string> = {};
      itemData?.forEach(item => {
        completedItems[item.item_id] = item.is_completed;
        itemNotes[item.item_id] = item.note || '';
      });

      const attachments: Record<string, any[]> = {};
      if (attachmentData) {
        attachmentData.forEach(att => {
          if (!attachments[att.item_id]) attachments[att.item_id] = [];
          const { data: urlData } = supabase.storage.from('checklist-attachments').getPublicUrl(att.file_path);
          attachments[att.item_id].push({ ...att, file_path: urlData.publicUrl });
        });
      }

      setExecutingChecklist(checklist);
      setActiveSubmission({ id: submission.id, status: submission.status, completedItems, itemNotes, attachments });
      setShowExecutionDialog(true);
    } catch (error) {
      toast.error('Failed to load checklist details');
    }
  };

  const persistExecution = async (results: any, status: 'in_progress' | 'completed') => {
    if (!houseId) return;
    const staffId = user?.staff_id;
    let submissionId = activeSubmission?.id;

    if (!submissionId) {
      const { data, error } = await supabase
        .from('house_checklist_submissions')
        .insert({
          checklist_id: results.checklist_id,
          house_id: houseId,
          master_id: executingChecklist?.master_id || null,
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
      // Find the master_item_id from the executing checklist items
      const originalItem = executingChecklist?.items?.find((i: any) => i.id === item.item_id);
      
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

  const handleSaveExecution = async (results: any) => {
    const id = await persistExecution(results, 'in_progress');
    
    // Update activeSubmission state so next save uses the same ID instead of creating a new one
    if (!activeSubmission) {
      const completedItems: Record<string, boolean> = {};
      const itemNotes: Record<string, string> = {};
      results.items.forEach((item: any) => {
        completedItems[item.item_id] = item.is_completed;
        itemNotes[item.item_id] = item.note || '';
      });
      setActiveSubmission({ id, completedItems, itemNotes, attachments: {} });
    }
    
    refreshHistory();
    refreshChecklists();
  };

  const handleCompleteExecution = async (results: any) => {
    await persistExecution(results, 'completed');
    setShowExecutionDialog(false);
    setExecutingChecklist(null);
    setActiveSubmission(null);
    refreshHistory();
    refreshChecklists();
  };

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5" id="checklist_history">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <History className="size-5 text-gray-500" />
            <CardTitle>Checklist History</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search history..." 
                className="pl-9 h-8 text-xs w-[200px]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="border border-gray-300 h-8 gap-1.5 font-bold">
                  <Plus className="size-3.5" />
                  Start New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Checklist</div>
                {loadingChecklists ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading templates...</div>
                ) : houseChecklists.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No checklists configured</div>
                ) : (
                  houseChecklists.map(cl => (
                    <DropdownMenuItem key={cl.id} className="cursor-pointer" onClick={() => handleStartNew(cl)}>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{cl.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{cl.frequency}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Checklist</th>
                  <th className="px-4 py-3">Staff / Submitter</th>
                  <th className="px-4 py-3 text-center">Status / Progress</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingHistory ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Loading checklist history...</td></tr>
                ) : filteredHistory.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">No checklist activity found</td></tr>
                ) : (
                  filteredHistory.map(sub => {
                    const isInProgress = sub.status === 'in_progress';
                    return (
                      <tr key={sub.id} className={`transition-colors ${isInProgress ? 'bg-primary/[0.01] hover:bg-primary/[0.03]' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{sub.checklist_name}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-medium">{sub.staff_name}</td>
                        <td className="px-4 py-3 text-center">
                          {isInProgress ? (
                            <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold">
                              DRAFT: {sub.completed_item_count}/{sub.item_count}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold text-[10px]">
                              COMPLETED: {sub.completed_item_count}/{sub.item_count}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-medium">
                          {format(new Date(sub.updated_at), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {isInProgress ? (
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="border border-gray-300 h-7 text-[10px] px-3 font-bold gap-1"
                                onClick={() => handleResume(sub)}
                              >
                                <PlayCircle className="size-3" />
                                Resume
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-7" 
                                title="View Submission"
                                onClick={() => handleResume(sub)}
                              >
                                <Eye className="size-3.5 text-gray-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showExecutionDialog} onOpenChange={setShowExecutionDialog}>
        <DialogContent className="max-w-3xl min-h-[500px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PlayCircle className="size-5 text-primary" />
              {executingChecklist?.name}
            </DialogTitle>
            <DialogDescription>
              Complete the required items and save your progress.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            {executingChecklist && (
              <HouseChecklistExecution 
                checklist={executingChecklist}
                onComplete={handleCompleteExecution}
                onSave={handleSaveExecution}
                onCancel={() => {
                  setShowExecutionDialog(false);
                  setActiveSubmission(null);
                }}
                isReadOnly={activeSubmission?.status === 'completed'}
                initialData={activeSubmission ? {
                  completedItems: activeSubmission.completedItems,
                  itemNotes: activeSubmission.itemNotes,
                  attachments: activeSubmission.attachments
                } : undefined}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
