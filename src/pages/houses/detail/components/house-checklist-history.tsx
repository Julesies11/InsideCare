import { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardTable } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  History, 
  Plus, 
  Search,
  Eye,
  AlertCircle,
  Filter,
  User,
  Users,
  Loader2
} from 'lucide-react';
import { useChecklistHistory, ChecklistSubmission } from '@/hooks/use-checklist-history';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HouseChecklistExecution } from './house-checklist-execution';
import { format, subDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface HouseChecklistHistoryProps {
  houseId?: string | null;
  onlyHistory?: boolean;
  assignedHouseIds?: string[]; // To allow filtering by assigned houses
}

export interface HouseChecklistHistoryRef {
  handleStartNew: (checklist: any, shiftId?: string) => Promise<void>;
  handleResume: (submission: any) => Promise<void>;
}

export const HouseChecklistHistory = forwardRef<HouseChecklistHistoryRef, HouseChecklistHistoryProps>(
  ({ houseId, onlyHistory = false, assignedHouseIds = [] }, ref) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // Table State
    const [pagination, setPagination] = useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffFilter, setStaffFilter] = useState<'all' | 'mine'>('all');

    // Filters for hook
    const filters = useMemo(() => ({
      houseIds: houseId ? [houseId] : (assignedHouseIds.length > 0 ? assignedHouseIds : undefined),
      staffId: staffFilter === 'mine' ? user?.staff_id : undefined,
      searchTerm: searchTerm
    }), [houseId, assignedHouseIds, staffFilter, user?.staff_id, searchTerm]);

    const { data: historyData, isLoading: loadingHistory, refetch: refreshHistory } = useChecklistHistory(
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      filters
    );

    const submissions = historyData?.data || [];
    const totalCount = historyData?.count || 0;

    const { houseChecklists, loading: loadingChecklists, refresh: refreshChecklists } = useHouseChecklists(houseId || undefined);
    
    const [showExecutionDialog, setShowExecutionDialog] = useState(false);
    const [executingChecklist, setExecutingChecklist] = useState<any>(null);
    const [executingShiftId, setExecutingShiftId] = useState<string | undefined>(undefined);
    const [activeSubmission, setActiveSubmission] = useState<any>(null);
    const [isResuming, setIsResuming] = useState(false);

    // Incomplete tasks logic (simplified for paginated view)
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const incompleteYesterdayCount = useMemo(() => {
      // This is a bit tricky with server-side pagination. 
      // For now, we'll just check if any in-progress items exist in the current page that were scheduled yesterday.
      // In a real app, you might want a separate count query for this.
      return submissions.filter(s => 
        s.scheduled_date === yesterdayStr && 
        s.status === 'in_progress'
      ).length;
    }, [submissions, yesterdayStr]);

    const handleStartNew = async (checklist: any, shiftId?: string) => {
      const existing = (submissions || []).find(s => s.checklist_id === checklist.id && s.status === 'in_progress');
      if (existing) {
        handleResume(existing as any);
        return;
      }

      setExecutingChecklist(checklist);
      setExecutingShiftId(shiftId);
      setActiveSubmission(null);
      setShowExecutionDialog(true);
    };

    const handleResume = async (submission: ChecklistSubmission) => {
      setIsResuming(true);
      const checklist = (houseChecklists || []).find(c => c.id === submission.checklist_id);
      if (!checklist) {
        // If not in pre-loaded houseChecklists (maybe it's for another house), fetch it
        try {
          const { data: clData, error: clError } = await supabase
            .from('house_checklists')
            .select(`
              id, house_id, name, description, master_id, created_at, updated_at,
              house_checklist_items (id, checklist_id, title, instructions, group_title, priority, is_required, sort_order, created_at, updated_at)
            `)
            .eq('id', submission.checklist_id)
            .single();

          if (clError) throw clError;
          
          setExecutingChecklist({
            ...clData,
            items: (clData.house_checklist_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
          });
        } catch (error) {
          toast.error('Checklist template not found');
          setIsResuming(false);
          return;
        }
      } else {
        setExecutingChecklist(checklist);
      }

      try {
        const { data: itemData } = await supabase
          .from('house_checklist_submission_items')
          .select(`
            id, 
            submission_id, 
            item_id, 
            is_completed, 
            status,
            note, 
            completed_at,
            completed_by_staff:staff!completed_by(id, name)
          `)
          .eq('submission_id', submission.id);

        const { data: attachmentData } = await supabase
          .from('house_checklist_item_attachments')
          .select('id, submission_id, item_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at')
          .eq('submission_id', submission.id);

        const completedItems: Record<string, boolean> = {};
        const itemNotes: Record<string, string> = {};
        const completedBy: Record<string, { id: string; name: string }> = {};
        
        itemData?.forEach((item: any) => {
          const isDone = item.status === 'Completed' || item.is_completed;
          completedItems[item.item_id] = isDone;
          itemNotes[item.item_id] = item.note || '';
          if (isDone && item.completed_by_staff) {
            completedBy[item.item_id] = {
              id: item.completed_by_staff.id,
              name: item.completed_by_staff.name
            };
          }
        });

        const attachments: Record<string, any[]> = {};
        if (attachmentData) {
          attachmentData.forEach(att => {
            if (!attachments[att.item_id]) attachments[att.item_id] = [];
            const { data: urlData } = supabase.storage.from('checklist-attachments').getPublicUrl(att.file_path);
            attachments[att.item_id].push({ ...att, file_path: urlData.publicUrl });
          });
        }

        setActiveSubmission({ id: submission.id, status: submission.status, completedItems, itemNotes, completedBy, attachments });
        setShowExecutionDialog(true);
      } catch (error) {
        toast.error('Failed to load checklist details');
      } finally {
        setIsResuming(false);
      }
    };

    const persistExecution = async (results: any, status: 'in_progress' | 'completed') => {
      // Use the house_id from the checklist if not provided in props
      const targetHouseId = houseId || executingChecklist?.house_id;
      if (!targetHouseId) {
        toast.error('No house ID associated with this checklist');
        return;
      }

      const staffId = user?.staff_id;
      let submissionId = activeSubmission?.id;

      if (!submissionId) {
        const { data, error } = await supabase
          .from('house_checklist_submissions')
          .insert({
            checklist_id: results.checklist_id,
            house_id: targetHouseId,
            master_id: executingChecklist?.master_id || null,
            submitted_by: staffId || null,
            shift_id: executingShiftId || null,
            status: status,
            scheduled_date: format(new Date(), 'yyyy-MM-dd'),
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
        const originalItem = executingChecklist?.items?.find((i: any) => i.id === item.item_id);
        return {
          submission_id: submissionId,
          item_id: item.item_id,
          master_item_id: originalItem?.master_item_id || null,
          is_completed: item.is_completed,
          status: item.is_completed ? 'Completed' : 'Pending',
          completed_by: item.completed_by,
          note: item.note,
          completed_at: item.is_completed ? new Date().toISOString() : null
        };
      });
      await supabase.from('house_checklist_submission_items').upsert(submissionItems, { onConflict: 'submission_id,item_id' });

      // Handle attachments...
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
      if (id && !activeSubmission) {
        const completedItems: Record<string, boolean> = {};
        const itemNotes: Record<string, string> = {};
        results.items.forEach((item: any) => {
          completedItems[item.item_id] = item.is_completed;
          itemNotes[item.item_id] = item.note || '';
        });
        setActiveSubmission({ id, completedItems, itemNotes, attachments: {} });
      }
      queryClient.invalidateQueries({ queryKey: ['house-checklists'] });
      refreshHistory();
      refreshChecklists();
    };

    const handleCompleteExecution = async (results: any) => {
      await persistExecution(results, 'completed');
      setShowExecutionDialog(false);
      setExecutingChecklist(null);
      setActiveSubmission(null);
      queryClient.invalidateQueries({ queryKey: ['house-checklists'] });
      refreshHistory();
      refreshChecklists();
    };

    useImperativeHandle(ref, () => ({
      handleStartNew,
      handleResume
    }));

    // Table Columns
    const columns = useMemo<ColumnDef<ChecklistSubmission>[]>(() => [
      {
        id: 'checklist_name',
        accessorKey: 'checklist_name',
        header: ({ column }) => <DataGridColumnHeader title="Checklist" column={column} />,
        cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.checklist_name}</span>,
        size: 200,
      },
      {
        id: 'house_name',
        accessorKey: 'house_name',
        header: ({ column }) => <DataGridColumnHeader title="House" column={column} />,
        cell: ({ row }) => <span className="text-gray-600">{row.original.house_name}</span>,
        size: 150,
      },
      {
        id: 'staff_name',
        accessorKey: 'staff_name',
        header: ({ column }) => <DataGridColumnHeader title="Staff Member" column={column} />,
        cell: ({ row }) => <span className="text-gray-600">{row.original.staff_name}</span>,
        size: 150,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status / Progress" column={column} className="justify-center" />,
        cell: ({ row }) => {
          const isInProgress = row.original.status === 'in_progress';
          return (
            <div className="text-center">
              {isInProgress ? (
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold">
                  IN PROGRESS: {row.original.completed_item_count}/{row.original.item_count}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold text-[10px]">
                  COMPLETED: {row.original.completed_item_count}/{row.original.item_count}
                </Badge>
              )}
            </div>
          );
        },
        size: 150,
      },
      {
        id: 'updated_at',
        accessorKey: 'updated_at',
        header: ({ column }) => <DataGridColumnHeader title="Last Activity" column={column} />,
        cell: ({ row }) => (
          <span className="text-gray-500 text-[11px]">
            {format(new Date(row.original.updated_at), 'MMM d, h:mm a')}
          </span>
        ),
        size: 150,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const isInProgress = row.original.status === 'in_progress';
          return (
            <div className="flex justify-end gap-1">
              {isInProgress ? (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="border border-gray-300 h-7 text-[10px] px-3 font-bold gap-1"
                  onClick={() => handleResume(row.original)}
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
                  onClick={() => handleResume(row.original)}
                >
                  <Eye className="size-3.5 text-gray-500" />
                </Button>
              )}
            </div>
          );
        },
        size: 100,
      },
    ], [houseChecklists]);

    const pageCount = useMemo(() => Math.ceil(totalCount / pagination.pageSize), [totalCount, pagination.pageSize]);

    const table = useReactTable({
      data: submissions,
      columns,
      state: {
        pagination,
        sorting,
      },
      onPaginationChange: setPagination,
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      manualPagination: true,
      manualSorting: true,
      pageCount,
    });

    return (
      <div className="flex flex-col gap-5 lg:gap-7.5" id="checklist_history">
        {!onlyHistory && incompleteYesterdayCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertCircle className="size-5 text-destructive animate-pulse" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-destructive">Incomplete tasks from yesterday!</h4>
              <p className="text-xs text-destructive/80">
                You have {incompleteYesterdayCount} checklist(s) with unfinished items from yesterday.
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-8 text-[10px] font-bold"
              onClick={() => {
                setSearchTerm(format(subDays(new Date(), 1), 'MMM d'));
              }}
            >
              REVIEW TASKS
            </Button>
          </div>
        )}

        <DataGrid
          table={table}
          recordCount={totalCount}
          isLoading={loadingHistory}
        >
          <Card className="border-0 sm:border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <History className="size-5 text-gray-500" />
                <CardTitle>Checklist History</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search checklists..." 
                    className="pl-9 h-8 text-xs w-[180px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex bg-muted p-0.5 rounded-lg border">
                  <Button 
                    variant={staffFilter === 'all' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className={`h-7 px-2.5 text-[10px] font-bold gap-1.5 ${staffFilter === 'all' ? 'bg-background shadow-sm' : ''}`}
                    onClick={() => setStaffFilter('all')}
                  >
                    <Users className="size-3" /> ALL
                  </Button>
                  <Button 
                    variant={staffFilter === 'mine' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className={`h-7 px-2.5 text-[10px] font-bold gap-1.5 ${staffFilter === 'mine' ? 'bg-background shadow-sm' : ''}`}
                    onClick={() => setStaffFilter('mine')}
                  >
                    <User className="size-3" /> MINE
                  </Button>
                </div>

                {!onlyHistory && (
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
                              {cl.description && <span className="text-[9px] text-muted-foreground line-clamp-1">{cl.description}</span>}
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter>
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>

        <Dialog open={isResuming} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-[300px] flex flex-col items-center justify-center py-10">
            <DialogHeader className="sr-only">
              <DialogTitle>Loading Checklist</DialogTitle>
            </DialogHeader>
            <Loader2 className="size-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium text-muted-foreground italic">Loading details...</p>
          </DialogContent>
        </Dialog>

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
);
