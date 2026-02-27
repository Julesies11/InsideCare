import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CheckSquare, Clock, PlayCircle, GripVertical, Loader2, ChevronDown, Copy } from 'lucide-react';
import { useHouseChecklists } from '@/hooks/useHouseChecklists';
import { useChecklistMaster } from '@/hooks/useChecklistMaster';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { HouseChecklistExecution } from './house-checklist-execution';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { handleSupabaseError } from '@/errors/error-handler';

interface HouseChecklistsProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseChecklists({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseChecklistsProps) {
  const { user } = useAuth();
  const { masterChecklists, loading: loadingMaster } = useChecklistMaster();
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [executingChecklist, setExecutingChecklist] = useState<any>(null);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [checklistFormData, setChecklistFormData] = useState<any>({
    name: '',
    frequency: 'daily',
    description: '',
    is_global: false,
    items: [],
  });
  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const { houseChecklists, loading, refresh } = useHouseChecklists(houseId);

  const handleAddChecklist = () => {
    setSelectedChecklist(null);
    setChecklistFormData({
      name: '',
      frequency: 'daily',
      description: '',
      is_global: false,
      items: [],
    });
    setShowChecklistDialog(true);
  };

  const handleEditChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setChecklistFormData({
      name: checklist.name,
      frequency: checklist.frequency,
      description: checklist.description || '',
      is_global: checklist.is_global || false,
      items: checklist.items || [],
    });
    setShowChecklistDialog(true);
  };

  const handleSaveChecklist = () => {
    if (!checklistFormData.name.trim() || !pendingChanges || !onPendingChangesChange) return;

    // Correct sort orders based on current sequence in checklistFormData
    const itemsWithUpdatedSortOrder = checklistFormData.items.map((item: any, index: number) => ({
      ...item,
      sort_order: index,
    }));

    const checklistData = {
      ...checklistFormData,
      items: itemsWithUpdatedSortOrder,
      house_id: houseId,
    };

    if (selectedChecklist) {
      // Update existing checklist
      if (selectedChecklist.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            toAdd: pendingChanges.checklists.toAdd.map(checklist =>
              checklist.tempId === selectedChecklist.tempId ? { ...checklist, ...checklistData } : checklist
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        // For checklist items of an existing checklist, we need to handle additions, updates, and deletions
        const originalItems = selectedChecklist.items || [];
        const currentItems = itemsWithUpdatedSortOrder;

        // Items to add (newly created in dialog)
        const itemsToAdd = currentItems.filter((item: any) => !item.id);
        
        // Items to update (existed and still exist)
        const itemsToUpdate = currentItems.filter((item: any) => item.id);
        
        // Items to delete (existed but no longer in dialog)
        const itemsToDeleteIds = originalItems
          .filter((origItem: any) => !currentItems.some((currItem: any) => currItem.id === origItem.id))
          .map((item: any) => item.id);

        const newPending = {
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            toUpdate: [
              ...pendingChanges.checklists.toUpdate.filter(c => c.id !== selectedChecklist.id),
              { id: selectedChecklist.id, ...checklistData },
            ],
            checklistItems: {
              toAdd: [
                ...pendingChanges.checklists.checklistItems.toAdd.filter(i => i.checklist_id !== selectedChecklist.id),
                ...itemsToAdd.map(i => ({ ...i, checklist_id: selectedChecklist.id }))
              ],
              toUpdate: [
                ...pendingChanges.checklists.checklistItems.toUpdate.filter(i => !itemsToUpdate.some(ui => ui.id === i.id)),
                ...itemsToUpdate
              ],
              toDelete: [
                ...pendingChanges.checklists.checklistItems.toDelete,
                ...itemsToDeleteIds
              ]
            }
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new checklist
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: [
            ...pendingChanges.checklists.toAdd,
            { tempId, ...checklistData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowChecklistDialog(false);
  };

  const handleDeleteChecklist = (checklist: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (checklist.tempId) {
      handleCancelPendingAdd(checklist.tempId);
      return;
    }

    if (confirm('Mark this checklist for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toDelete: [...pendingChanges.checklists.toDelete, checklist.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleAddItem = (checklistId: string) => {
    setSelectedChecklist(checklistId);
    setSelectedItem(null);
    setItemFormData({
      title: '',
      instructions: '',
      priority: 'medium',
      is_required: true,
      sort_order: 0,
    });
    setShowItemDialog(true);
  };

  const handleStartExecution = async (checklist: any) => {
    if (!houseId) return;
    
    setLoadingSubmission(true);
    try {
      // Check for existing in_progress submission for this checklist and house
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
        // Map submission items to the format expected by the component
        const completedItems: Record<string, boolean> = {};
        const itemNotes: Record<string, string> = {};
        
        data.house_checklist_submission_items.forEach((item: any) => {
          completedItems[item.item_id] = item.is_completed;
          itemNotes[item.item_id] = item.note || '';
        });

        setActiveSubmission({
          id: data.id,
          completedItems,
          itemNotes
        });
      } else {
        setActiveSubmission(null);
      }

      setExecutingChecklist(checklist);
      setShowExecutionDialog(true);
    } catch (error: any) {
      console.error('Error fetching submission:', error);
      toast.error('Failed to load checklist progress');
    } finally {
      setLoadingSubmission(false);
    }
  };

  const persistExecution = async (results: any, status: 'in_progress' | 'completed') => {
    console.log('Starting persistExecution', { results, status, user, houseId });
    
    // Use staff_id directly from the user object if available
    const staffId = user?.staff_id;
    
    if (!houseId) {
      console.error('Missing houseId');
      return;
    }

    console.log('Resolved staffId:', staffId);

    if (!staffId) {
      toast.error('Could not find your staff record in the session. Progress may not be saved correctly.');
      // We don't return here because we might still want to try saving if it's an admin
    }

    let submissionId = activeSubmission?.id;
    console.log('Active submission ID:', submissionId);

    if (!submissionId) {
      // Create new submission
      console.log('Creating new submission for checklist:', results.checklist_id);
      const { data, error } = await supabase
        .from('house_checklist_submissions')
        .insert({
          checklist_id: results.checklist_id,
          house_id: houseId,
          submitted_by: staffId || null,
          status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating submission:', error);
        throw error;
      }
      submissionId = data.id;
      console.log('New submission created:', submissionId);
    } else {
      // Update existing submission
      console.log('Updating existing submission:', submissionId);
      const { error } = await supabase
        .from('house_checklist_submissions')
        .update({
          status: status,
          submitted_by: staffId || null,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Error updating submission:', error);
        throw error;
      }
    }

    // Upsert items
    console.log('Upserting items for submission:', submissionId);
    const submissionItems = results.items.map((item: any) => ({
      submission_id: submissionId,
      item_id: item.item_id,
      is_completed: item.is_completed,
      note: item.note,
      completed_at: item.is_completed ? new Date().toISOString() : null
    }));

    const { error: itemsError } = await supabase
      .from('house_checklist_submission_items')
      .upsert(submissionItems, { onConflict: 'submission_id,item_id' });

    if (itemsError) {
      console.error('Error upserting submission items:', itemsError);
      throw itemsError;
    }

    console.log('persistExecution completed successfully');
    return submissionId;
  };

  const handleSaveExecution = async (results: any) => {
    try {
      const id = await persistExecution(results, 'in_progress');
      // Update local state for active submission so next save works
      const completedItems: Record<string, boolean> = {};
      const itemNotes: Record<string, string> = {};
      results.items.forEach((item: any) => {
        completedItems[item.item_id] = item.is_completed;
        itemNotes[item.item_id] = item.note || '';
      });
      setActiveSubmission({ id, completedItems, itemNotes });
      refresh();
    } catch (error: any) {
      console.error('Error saving progress:', error);
      throw error;
    }
  };

  const handleCompleteExecution = async (results: any) => {
    try {
      await persistExecution(results, 'completed');
      setShowExecutionDialog(false);
      setExecutingChecklist(null);
      setActiveSubmission(null);
      // Refresh the list to update button states (from Start to Resume or back)
      refresh();
    } catch (error: any) {
      console.error('Error completing checklist:', error);
      throw error;
    }
  };

  const handleSelectTemplate = (template: any) => {
    if (!houseId || !pendingChanges || !onPendingChangesChange) return;

    const tempId = `temp-cl-${Date.now()}`;
    const newChecklist = {
      tempId,
      house_id: houseId,
      master_id: template.id,
      name: template.name,
      frequency: template.frequency,
      description: template.description,
      items: (template.items || []).map((item: any) => ({
        tempId: `temp-item-${Date.now()}-${Math.random()}`,
        title: item.title,
        instructions: item.instructions,
        priority: item.priority,
        is_required: item.is_required,
        sort_order: item.sort_order
      }))
    };

    const newPending = {
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toAdd: [...pendingChanges.checklists.toAdd, newChecklist]
      }
    };

    onPendingChangesChange(newPending);
    setShowTemplateDialog(false);
    toast.success(`Checklist created from template: ${template.name}`);
  };

  const handleEditItem = (checklistId: string, item: any) => {
    setSelectedChecklist(checklistId);
    setSelectedItem(item);
    setItemFormData({
      title: item.title,
      instructions: item.instructions || '',
      priority: item.priority,
      is_required: item.is_required,
      sort_order: item.sort_order,
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = () => {
    if (!itemFormData.title.trim()) return;

    const itemData = {
      ...itemFormData,
    };

    if (selectedItem) {
      // Update item in checklistFormData
      setChecklistFormData({
        ...checklistFormData,
        items: checklistFormData.items.map((item: any) => 
          (item.id && item.id === selectedItem.id) || (item.tempId && item.tempId === selectedItem.tempId)
            ? { ...item, ...itemData }
            : item
        )
      });
    } else {
      // Add new item to checklistFormData
      const tempId = `temp-item-${Date.now()}-${Math.random()}`;
      setChecklistFormData({
        ...checklistFormData,
        items: [...checklistFormData.items, { ...itemData, tempId }]
      });
    }
    setShowItemDialog(false);
  };

  const handleDeleteItemFromDialog = (itemToDelete: any) => {
    setChecklistFormData({
      ...checklistFormData,
      items: checklistFormData.items.filter((item: any) => 
        !((item.id && item.id === itemToDelete.id) || (item.tempId && item.tempId === itemToDelete.tempId))
      )
    });
  };

  const handleDeleteItem = (checklistId: string, item: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (item.tempId) {
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: pendingChanges.checklists.toAdd.map(checklist =>
            checklist.tempId === checklistId ? {
              ...checklist,
              items: checklist.items.filter(i => i.tempId !== item.tempId)
            } : checklist
          ),
        },
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (confirm('Mark this checklist item for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          checklistItems: {
            ...pendingChanges.checklists.checklistItems,
            toDelete: [...pendingChanges.checklists.checklistItems.toDelete, item.id],
          },
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toAdd: pendingChanges.checklists.toAdd.filter(checklist => checklist.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toUpdate: pendingChanges.checklists.toUpdate.filter(checklist => checklist.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toDelete: pendingChanges.checklists.toDelete.filter(checklistId => checklistId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const visibleChecklists = [
    ...houseChecklists
      .filter(checklist => !pendingChanges?.checklists.toDelete.includes(checklist.id))
      .map(checklist => {
        const update = pendingChanges?.checklists.toUpdate.find(u => u.id === checklist.id);
        return update ? { ...checklist, ...update } : checklist;
      }),
    ...(pendingChanges?.checklists.toAdd || []),
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'blue';
      case 'weekly': return 'purple';
      case 'monthly': return 'orange';
      case 'quarterly': return 'pink';
      default: return 'gray';
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5 lg:gap-7.5" id="checklists">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="size-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">House Checklists</h2>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="border border-gray-300" disabled={!houseId || !canAdd}>
                <Plus className="size-4 me-1.5" />
                New Checklist
                <ChevronDown className="size-4 ms-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleAddChecklist} className="cursor-pointer">
                <Plus className="size-4 me-2" />
                Create Ad-hoc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTemplateDialog(true)} className="cursor-pointer">
                <Copy className="size-4 me-2" />
                Add from Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading checklists...</CardContent>
          </Card>
        ) : visibleChecklists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-dashed">
              <CheckSquare className="size-12 mb-4 opacity-20" />
              <p>No checklists created yet</p>
              <p className="text-sm">Create checklists to track regular tasks and procedures</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
            {visibleChecklists.map((checklist) => {
              const isPendingAdd = 'tempId' in checklist;
              const isPendingUpdate = pendingChanges?.checklists.toUpdate.some(c => c.id === (checklist as any).id);
              const isPendingDelete = pendingChanges?.checklists.toDelete.includes((checklist as any).id);
              const checklistItems = checklist.items || [];
              const previewItems = checklistItems.slice(0, 3);
              const remainingCount = Math.max(0, checklistItems.length - 3);

              return (
                <Card 
                  key={(checklist as any).id || (checklist as any).tempId} 
                  className={`flex flex-col h-full transition-all hover:shadow-sm ${
                    isPendingAdd ? 'bg-primary/5 border-primary/20' :
                    isPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' :
                    isPendingUpdate ? 'bg-warning/5 border-warning/20' : ''
                  }`}
                >
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-base font-bold text-gray-900 truncate ${isPendingDelete ? 'line-through' : ''}`}>
                          {checklist.name}
                        </h3>
                        <Badge variant="outline" className={`text-[10px] h-4 border-${getFrequencyColor(checklist.frequency)}-200 text-${getFrequencyColor(checklist.frequency)}-600 bg-${getFrequencyColor(checklist.frequency)}-50 px-1 uppercase`}>
                          {checklist.frequency}
                        </Badge>
                        {isPendingAdd && (
                          <Badge variant="outline" className="text-[10px] h-4 border-primary-200 text-primary bg-primary/10 px-1 flex items-center gap-1">
                            <Clock className="size-2.5" />
                            PENDING ADD
                          </Badge>
                        )}
                        {isPendingUpdate && (
                          <Badge variant="outline" className="text-[10px] h-4 border-warning-200 text-warning bg-warning/10 px-1 flex items-center gap-1">
                            <Clock className="size-2.5" />
                            PENDING UPDATE
                          </Badge>
                        )}
                        {isPendingDelete && (
                          <Badge variant="outline" className="text-[10px] h-4 border-destructive-200 text-destructive bg-destructive/10 px-1 flex items-center gap-1">
                            <Clock className="size-2.5" />
                            PENDING DELETION
                          </Badge>
                        )}
                      </div>
                      {checklist.is_global && (
                        <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">Global Template</span>
                      )}
                      {checklist.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{checklist.description}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEditChecklist(checklist)}>
                        <Edit className="size-3.5" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleDeleteChecklist(checklist)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pb-4">
                    <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[1px] before:bg-muted-foreground/10">
                      {checklistItems.length === 0 ? (
                        <div className="text-xs text-muted-foreground ml-6 py-2 italic">
                          No items added yet
                        </div>
                      ) : (
                        previewItems.map((item: any, index: number) => (
                          <div key={item.id || item.tempId} className="flex items-start gap-3 relative z-10">
                            <div className="shrink-0 size-5 rounded-full bg-background border border-muted-foreground/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {index + 1}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-gray-700 truncate">{item.title}</span>
                              {item.is_required && <span className="text-[9px] text-red-500">Required</span>}
                            </div>
                          </div>
                        ))
                      )}
                      {remainingCount > 0 && (
                        <div className="ml-6 text-[10px] text-muted-foreground font-medium">
                          + {remainingCount} more tasks...
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <div className="p-4 pt-0 mt-auto border-t border-dashed flex flex-col gap-2">
                    {checklist.latest_submission?.status === 'in_progress' && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-primary font-bold uppercase flex items-center gap-1">
                          <Clock className="size-3" />
                          In Progress
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Saved {new Date(checklist.latest_submission.updated_at).toLocaleDateString()} {new Date(checklist.latest_submission.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    )}
                    <Button 
                      variant={checklist.latest_submission?.status === 'in_progress' ? "primary" : "secondary"} 
                      size="sm" 
                      className="h-8 text-xs shadow-sm w-full mt-1"
                      onClick={() => handleStartExecution(checklist)}
                      disabled={isPendingAdd || isPendingUpdate || checklistItems.length === 0}
                    >
                      <PlayCircle className="size-3.5 me-1.5" />
                      {checklist.latest_submission?.status === 'in_progress' ? 'Resume Checklist' : 'Start Checklist'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{selectedChecklist ? 'Edit Checklist' : 'Add Checklist'}</DialogTitle>
            <DialogDescription>
              {selectedChecklist
                ? 'Update checklist details and manage items'
                : 'Create a new checklist for this house'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Checklist Name *</Label>
                <Input
                  id="name"
                  value={checklistFormData.name}
                  onChange={(e) => setChecklistFormData({ ...checklistFormData, name: e.target.value })}
                  placeholder="Enter checklist name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={checklistFormData.frequency} onValueChange={(value) => setChecklistFormData({ ...checklistFormData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={checklistFormData.description}
                onChange={(e) => setChecklistFormData({ ...checklistFormData, description: e.target.value })}
                placeholder="Describe what this checklist is for"
                rows={2}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Checklist Items</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedItem(null);
                    setItemFormData({
                      title: '',
                      instructions: '',
                      priority: 'medium',
                      is_required: true,
                      sort_order: checklistFormData.items.length,
                    });
                    setShowItemDialog(true);
                  }}
                  className="h-8 text-xs"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add Item
                </Button>
              </div>

              {checklistFormData.items.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed text-sm text-muted-foreground">
                  No items added yet. Click "Add Item" to start building your checklist.
                </div>
              ) : (
                <Sortable
                  value={checklistFormData.items}
                  onValueChange={(newItems) => setChecklistFormData({ ...checklistFormData, items: newItems })}
                  getItemValue={(item) => (item.id || item.tempId).toString()}
                  className="space-y-2"
                >
                  {checklistFormData.items.map((item: any) => (
                    <SortableItem 
                      key={item.id || item.tempId} 
                      value={(item.id || item.tempId).toString()}
                      className="flex items-center gap-3 p-3 bg-background border rounded-lg group"
                    >
                      <SortableItemHandle className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors cursor-grab active:cursor-grabbing">
                        <GripVertical className="size-4" />
                      </SortableItemHandle>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium truncate">{item.title}</span>
                          {item.is_required && <Badge variant="outline" className="text-[9px] h-3.5 border-red-200 text-red-600 bg-red-50 px-1">Req</Badge>}
                          <Badge variant="outline" className={`text-[9px] h-3.5 border-${getPriorityColor(item.priority)}-200 text-${getPriorityColor(item.priority)}-600 bg-${getPriorityColor(item.priority)}-50 px-1 uppercase`}>
                            {item.priority}
                          </Badge>
                        </div>
                        {item.instructions && (
                          <p className="text-[10px] text-muted-foreground truncate">{item.instructions}</p>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-7" 
                          onClick={() => {
                            setSelectedItem(item);
                            setItemFormData({
                              title: item.title,
                              instructions: item.instructions || '',
                              priority: item.priority,
                              is_required: item.is_required,
                              sort_order: item.sort_order,
                            });
                            setShowItemDialog(true);
                          }}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-7 text-destructive" 
                          onClick={() => handleDeleteItemFromDialog(item)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </SortableItem>
                  ))}
                </Sortable>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 border-t mt-0">
            <Button variant="outline" onClick={() => setShowChecklistDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveChecklist}>Save Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Update checklist item details'
                : 'Add a new item to this checklist'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                value={itemFormData.title}
                onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                placeholder="Enter item title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={itemFormData.instructions}
                onChange={(e) => setItemFormData({ ...itemFormData, instructions: e.target.value })}
                placeholder="Provide instructions for completing this item"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={itemFormData.priority} onValueChange={(value) => setItemFormData({ ...itemFormData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={itemFormData.sort_order}
                  onChange={(e) => setItemFormData({ ...itemFormData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_required"
                checked={itemFormData.is_required}
                onCheckedChange={(checked) => setItemFormData({ ...itemFormData, is_required: !!checked })}
              />
              <Label htmlFor="is_required" className="cursor-pointer">Required Item</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add from Template</DialogTitle>
            <DialogDescription>
              Select a master checklist template to add to this house.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingMaster ? (
              <div className="py-12 text-center">
                <Loader2 className="size-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading templates...</p>
              </div>
            ) : masterChecklists.length === 0 ? (
              <div className="py-12 text-center bg-muted/20 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">No templates available. Create them in Admin {'>'} Checklist Templates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {masterChecklists.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="flex flex-col text-left p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {template.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {template.frequency}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-auto text-[10px] font-medium text-gray-500">
                      {template.items?.length || 0} tasks included
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Execution Dialog */}
      <Dialog open={showExecutionDialog} onOpenChange={setShowExecutionDialog}>
        <DialogContent className="max-w-2xl min-h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="size-5 text-primary" />
              {executingChecklist?.name}
            </DialogTitle>
            <DialogDescription>
              Complete the following items one by one. Required items must be checked to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 py-4 overflow-hidden">
            {executingChecklist && (
              <HouseChecklistExecution 
                checklist={executingChecklist}
                onComplete={handleCompleteExecution}
                onSave={handleSaveExecution}
                onCancel={() => {
                  setShowExecutionDialog(false);
                  setActiveSubmission(null);
                }}
                initialData={activeSubmission ? {
                  completedItems: activeSubmission.completedItems,
                  itemNotes: activeSubmission.itemNotes
                } : undefined}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
