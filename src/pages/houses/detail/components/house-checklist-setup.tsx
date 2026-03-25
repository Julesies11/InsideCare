import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, CheckSquare, GripVertical, Loader2, ChevronDown, Copy, CalendarDays, Download, Settings2, X, AlertCircle, Move } from 'lucide-react';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useChecklistMaster } from '@/hooks/use-checklist-master';
import { useHouses } from '@/hooks/use-houses';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChecklistCard } from '@/components/checklists/checklist-card';
import { HouseChecklistScheduleModal } from './HouseChecklistScheduleModal';
import { cn, getPeriodTheme } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface HouseChecklistSetupProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  onRefresh?: () => void;
  directSave?: boolean;
}

export function HouseChecklistSetup({ 
  houseId, 
  canAdd, 
  pendingChanges,
  onPendingChangesChange,
  onRefresh,
  directSave = false
}: HouseChecklistSetupProps) {
  const { houseChecklists, isLoading: loading, refresh: refreshChecklists } = useHouseChecklists(houseId);
  const { masterChecklists, isLoading: loadingMaster } = useChecklistMaster();
  const { houses: allHouses } = useHouses(0, 100); 
  
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const [selectedForSchedule, setSelectedForSchedule] = useState<any>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Import State
  const [importSourceHouseId, setImportSourceHouseId] = useState<string>('');
  const [sourceChecklists, setSourceChecklists] = useState<any[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [isFetchingSource, setIsFetchingSource] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [checklistFormData, setChecklistFormData] = useState<{
    name: string;
    frequency: string;
    days_of_week: string[];
    description: string;
    items: any[];
  }>({
    name: '',
    frequency: 'daily',
    days_of_week: [],
    description: '',
    items: [],
  });

  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    group_id: '',
    group_title: 'Morning',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const handleAddChecklist = () => {
    setSelectedChecklist(null);
    setChecklistFormData({
      name: '',
      frequency: 'daily',
      days_of_week: [],
      description: '',
      items: [],
    });
    setShowChecklistDialog(true);
  };

  const handleEditChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setChecklistFormData({
      name: checklist.name,
      frequency: checklist.frequency,
      days_of_week: checklist.days_of_week || [],
      description: checklist.description || '',
      items: checklist.items || [],
    });
    setShowChecklistDialog(true);
  };

  const handleSortChecklists = async (newChecklists: any[]) => {
    if (directSave && houseId) {
      try {
        const toUpsert = newChecklists.map((cl, index) => ({
          id: cl.id,
          house_id: houseId,
          name: cl.name,
          frequency: cl.frequency,
          sort_order: index
        }));

        const { error } = await supabase.from('house_checklists').upsert(toUpsert);
        if (error) throw error;
        refreshChecklists();
        return;
      } catch (err: any) {
        toast.error(`Failed to save order: ${err.message}`);
        return;
      }
    }

    if (!onPendingChangesChange || !pendingChanges) return;

    const updatedToAdd = [...(pendingChanges.checklists?.toAdd || [])];
    const updatedToUpdate = [...(pendingChanges.checklists?.toUpdate || [])];

    newChecklists.forEach((cl, index) => {
      if (cl.tempId) {
        const addIdx = updatedToAdd.findIndex(a => a.tempId === cl.tempId);
        if (addIdx !== -1) updatedToAdd[addIdx].sort_order = index;
      } else {
        const upIdx = updatedToUpdate.findIndex(u => u.id === cl.id);
        if (upIdx !== -1) {
          updatedToUpdate[upIdx].sort_order = index;
        } else {
          updatedToUpdate.push({ id: cl.id, sort_order: index });
        }
      }
    });

    onPendingChangesChange({
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toAdd: updatedToAdd,
        toUpdate: updatedToUpdate
      }
    });
  };

  const handleSaveChecklist = async () => {
    if (!checklistFormData.name.trim() || !houseId) return;

    const itemsWithUpdatedSortOrder = checklistFormData.items.map((item: any, index: number) => ({
      ...item,
      sort_order: index,
    }));

    if (directSave) {
      try {
        let savedChecklistId = selectedChecklist?.id;

        if (savedChecklistId && !selectedChecklist.tempId) {
          const { error } = await supabase
            .from('house_checklists')
            .update({
              name: checklistFormData.name,
              description: checklistFormData.description,
              frequency: checklistFormData.frequency,
              days_of_week: checklistFormData.days_of_week,
              updated_at: new Date().toISOString()
            })
            .eq('id', savedChecklistId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('house_checklists')
            .insert({
              house_id: houseId,
              name: checklistFormData.name,
              description: checklistFormData.description,
              frequency: checklistFormData.frequency,
              days_of_week: checklistFormData.days_of_week,
              sort_order: houseChecklists.length * 10
            })
            .select()
            .single();
          if (error) throw error;
          savedChecklistId = data.id;
        }

        const currentItems = itemsWithUpdatedSortOrder;
        
        if (selectedChecklist?.items) {
          const toDelete = selectedChecklist.items
            .filter((orig: any) => !currentItems.some((curr: any) => curr.id === orig.id))
            .map((i: any) => i.id);
          
          if (toDelete.length > 0) {
            await supabase.from('house_checklist_items').delete().in('id', toDelete);
          }
        }

        const toUpsert = currentItems.map(i => ({
          id: i.id || undefined,
          checklist_id: savedChecklistId,
          title: i.title,
          instructions: i.instructions,
          group_title: i.group_title,
          priority: i.priority,
          is_required: i.is_required,
          sort_order: i.sort_order
        }));

        const { error: upsertErr } = await supabase.from('house_checklist_items').upsert(toUpsert);
        if (upsertErr) throw upsertErr;

        toast.success('Checklist saved to database');
        refreshChecklists();
        setShowChecklistDialog(false);
        return;
      } catch (err: any) {
        toast.error(`Database error: ${err.message}`);
        return;
      }
    }

    if (!pendingChanges || !onPendingChangesChange) return;

    const checklistData = {
      ...checklistFormData,
      items: itemsWithUpdatedSortOrder,
      house_id: houseId,
    };

    if (selectedChecklist) {
      if (selectedChecklist.tempId) {
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
        const originalItems = selectedChecklist.items || [];
        const currentItems = itemsWithUpdatedSortOrder;
        const itemsToAdd = currentItems.filter((item: any) => !item.id);
        const itemsToUpdate = currentItems.filter((item: any) => item.id);
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
      const tempId = `temp-cl-${Date.now()}`;
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: [...pendingChanges.checklists.toAdd, { tempId, ...checklistData }],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowChecklistDialog(false);
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
      items: (template.items || []).map((item: any) => {
        return {
          tempId: `temp-item-${Date.now()}-${Math.random()}`,
          master_item_id: item.id,
          title: item.title,
          instructions: item.instructions,
          group_title: item.group_title,
          priority: item.priority,
          is_required: item.is_required,
          sort_order: item.sort_order
        };
      })
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

  const handleSaveItem = () => {
    if (!itemFormData.title.trim()) return;
    
    if (selectedItem) {
      setChecklistFormData({
        ...checklistFormData,
        items: checklistFormData.items.map((item: any) => 
          (item.id && item.id === selectedItem.id) || (item.tempId && item.tempId === selectedItem.tempId) 
            ? { ...item, ...itemFormData } 
            : item
        )
      });
    } else {
      const tempId = `temp-item-${Date.now()}-${Math.random()}`;
      setChecklistFormData({
        ...checklistFormData,
        items: [...checklistFormData.items, { ...itemFormData, tempId }]
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

  const handleDeleteChecklist = (checklist: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    if (checklist.tempId) {
      onPendingChangesChange({
        ...pendingChanges,
        checklists: { ...pendingChanges.checklists, toAdd: pendingChanges.checklists.toAdd.filter(c => c.tempId !== checklist.tempId) }
      });
      return;
    }
    if (confirm('Delete this checklist from the house? This will not affect historical submissions.')) {
      onPendingChangesChange({
        ...pendingChanges,
        checklists: { ...pendingChanges.checklists, toDelete: [...pendingChanges.checklists.toDelete, checklist.id] }
      });
    }
  };

  const handleFetchSourceChecklists = async (sourceId: string) => {
    setImportSourceHouseId(sourceId);
    if (!sourceId) {
      setSourceChecklists([]);
      return;
    }

    setIsFetchingSource(true);
    try {
      const { data, error } = await supabase
        .from('house_checklists')
        .select(`
          id, name, frequency, description, sort_order,
          items:house_checklist_items(id, title, instructions, group_title, priority, is_required, sort_order)
        `)
        .eq('house_id', sourceId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSourceChecklists(data || []);
      setSelectedImportIds([]);
    } catch (err) {
      console.error('Error fetching source checklists:', err);
      toast.error('Failed to load checklists from source house');
    } finally {
      setIsFetchingSource(false);
    }
  };

  const handleImportChecklists = async () => {
    if (selectedImportIds.length === 0 || !houseId) return;

    if (!directSave && (!onPendingChangesChange || !pendingChanges)) {
      toast.error('Component configuration error: Missing change handlers.');
      return;
    }

    setIsImporting(true);
    try {
      const checklistsToAdd: any[] = [];
      
      for (const id of selectedImportIds) {
        const source = sourceChecklists.find(cl => cl.id === id);
        if (!source) continue;

        const tempId = `temp-import-${Date.now()}-${Math.random()}`;
        
        const checklistData = {
          tempId,
          house_id: houseId,
          name: source.name,
          frequency: source.frequency,
          description: source.description,
          items: (source.items || []).map((item: any) => ({
            tempId: `temp-item-import-${Date.now()}-${Math.random()}`,
            title: item.title,
            instructions: item.instructions,
            group_title: item.group_title,
            priority: item.priority,
            is_required: item.is_required,
            sort_order: item.sort_order
          }))
        };

        if (directSave) {
          const { data: newCl, error: clErr } = await supabase
            .from('house_checklists')
            .insert({
              house_id: houseId,
              name: checklistData.name,
              description: checklistData.description,
              frequency: checklistData.frequency,
              sort_order: houseChecklists.length * 10
            })
            .select()
            .single();
          
          if (clErr) throw clErr;

          const toInsertItems = checklistData.items.map(i => ({
            checklist_id: newCl.id,
            title: i.title,
            instructions: i.instructions,
            group_title: i.group_title,
            priority: i.priority,
            is_required: i.is_required,
            sort_order: i.sort_order
          }));

          const { error: itemsErr } = await supabase.from('house_checklist_items').insert(toInsertItems);
          if (itemsErr) throw itemsErr;
        } else {
          checklistsToAdd.push(checklistData);
        }
      }

      if (!directSave) {
        onPendingChangesChange!({
          ...pendingChanges!,
          checklists: {
            ...pendingChanges!.checklists,
            toAdd: [...(pendingChanges!.checklists?.toAdd || []), ...checklistsToAdd]
          }
        });
      }

      toast.success(directSave ? 'Checklists imported to database' : `Successfully imported ${checklistsToAdd.length} checklists.`);
      if (directSave) refreshChecklists();
      setShowImportDialog(false);
    } catch (err: any) {
      toast.error(`Failed to import checklists: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const visibleChecklists = [
    ...(houseChecklists || [])
      .filter(checklist => !pendingChanges?.checklists?.toDelete?.includes(checklist.id))
      .map(checklist => {
        const update = pendingChanges?.checklists?.toUpdate?.find(u => u.id === checklist.id);
        return update ? { ...checklist, ...update } : checklist;
      }),
    ...(pendingChanges?.checklists?.toAdd || []),
  ];

  return (
    <>
      <div className="flex flex-col gap-6 lg:gap-8" id="checklists">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckSquare className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Checklist Setup</h2>
              <p className="text-xs text-muted-foreground font-medium">Configure house-specific tasks and routines</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 font-bold border-gray-300 shadow-sm"
              onClick={() => setShowImportDialog(true)}
              disabled={!houseId || !canAdd}
            >
              <Download className="size-4" />
              Import
            </Button>
            
            <Button 
              variant="primary" 
              size="sm" 
              className="gap-1.5 font-bold shadow-sm" 
              disabled={!houseId || !canAdd}
              onClick={handleAddChecklist}
            >
              <Plus className="size-4" />
              Add Checklist
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary/50" />
            <p className="text-sm text-muted-foreground font-medium">Loading checklist configuration...</p>
          </div>
        ) : visibleChecklists.length === 0 ? (
          <div className="py-20 text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
            <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="size-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium italic">No checklists configured for this house.</p>
            <p className="text-xs text-gray-400 mt-2">Start by adding a new checklist or importing from another house.</p>
          </div>
        ) : (
          <Sortable 
            value={visibleChecklists} 
            onValueChange={handleSortChecklists}
            getItemValue={(cl) => (cl.id || cl.tempId).toString()}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {visibleChecklists.map((checklist) => {
              const isPendingAdd = 'tempId' in checklist;
              const isPendingUpdate = pendingChanges?.checklists.toUpdate.some(c => c.id === (checklist as any).id);
              const isPendingDelete = pendingChanges?.checklists.toDelete.includes((checklist as any).id);

              return (
                <SortableItem key={(checklist as any).id || (checklist as any).tempId} value={((checklist as any).id || (checklist as any).tempId).toString()}>
                  <ChecklistCard 
                    checklist={checklist}
                    isPendingAdd={isPendingAdd}
                    isPendingUpdate={isPendingUpdate}
                    isPendingDelete={isPendingDelete}
                    onDelete={handleDeleteChecklist}
                    renderActions={(cl) => (
                      <>
                        <SortableItemHandle>
                          <Button variant="ghost" size="icon" className="size-8 text-gray-400 cursor-grab hover:text-primary">
                            <Move className="size-3.5" />
                          </Button>
                        </SortableItemHandle>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-primary hover:bg-primary/5" 
                          title="Schedule on Calendar"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cl.id) {
                              setSelectedForSchedule({ id: cl.id, name: cl.name });
                              setShowScheduleModal(true);
                            } else {
                              toast.error('Please save changes before scheduling.');
                            }
                          }}
                        >
                          <CalendarDays className="size-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 hover:bg-gray-100" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChecklist(cl);
                          }}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                      </>
                    )}
                  />
                </SortableItem>
              );
            })}
          </Sortable>
        )}
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-5 text-primary" />
              Import Checklists
            </DialogTitle>
            <DialogDescription>
              Select a house to "pull" checklist routines from.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-2">
              <Label>Source House</Label>
              <Select value={importSourceHouseId} onValueChange={handleFetchSourceChecklists}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source house..." />
                </SelectTrigger>
                <SelectContent>
                  {allHouses
                    .filter(h => h.id !== houseId && h.status === 'active')
                    .map(h => {
                      const count = (h as any).checklists?.[0]?.count || 0;
                      return (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name} ({count} checklist{count !== 1 ? 's' : ''})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {isFetchingSource ? (
              <div className="py-12 text-center">
                <Loader2 className="size-8 animate-spin mx-auto text-primary/30" />
              </div>
            ) : importSourceHouseId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available Checklists ({sourceChecklists.length})</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] font-bold"
                    onClick={() => {
                      if (selectedImportIds.length === sourceChecklists.length) setSelectedImportIds([]);
                      else setSelectedImportIds(sourceChecklists.map(cl => cl.id));
                    }}
                  >
                    {selectedImportIds.length === sourceChecklists.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="space-y-2 border rounded-xl overflow-hidden divide-y">
                  {sourceChecklists.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground italic text-sm">No checklists found in this house.</div>
                  ) : (
                    sourceChecklists.map(cl => (
                      <div 
                        key={cl.id} 
                        className={cn(
                          "flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                          selectedImportIds.includes(cl.id) && "bg-primary/[0.02]"
                        )}
                        onClick={() => {
                          setSelectedImportIds(prev => 
                            prev.includes(cl.id) ? prev.filter(i => i !== cl.id) : [...prev, cl.id]
                          );
                        }}
                      >
                        <Checkbox 
                          checked={selectedImportIds.includes(cl.id)}
                          onCheckedChange={() => {}} 
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">{cl.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{cl.description || 'No description'}</p>
                          <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {cl.items?.length || 0} tasks included
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleImportChecklists}
              disabled={selectedImportIds.length === 0 || isImporting}
              className="gap-2 font-bold"
            >
              {isImporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Import {selectedImportIds.length > 0 ? `(${selectedImportIds.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{selectedChecklist ? 'Edit Checklist' : 'Add Checklist'}</DialogTitle>
            <DialogDescription>Define the tasks for this house-specific checklist.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="setup-name">Name *</Label>
              <Input id="setup-name" value={checklistFormData.name} onChange={(e) => setChecklistFormData({ ...checklistFormData, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-desc">Description</Label>
              <Textarea id="setup-desc" value={checklistFormData.description} onChange={(e) => setChecklistFormData({ ...checklistFormData, description: e.target.value })} rows={2} />
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Tasks</Label>
                <Button variant="outline" size="sm" onClick={() => { 
                  setSelectedItem(null); 
                  setItemFormData({ 
                    title: '', 
                    instructions: '', 
                    group_id: '',
                    group_title: 'Morning',
                    priority: 'medium', 
                    is_required: true, 
                    sort_order: checklistFormData.items.length 
                  }); 
                  setShowItemDialog(true); 
                }}>

                  <Plus className="size-3.5 mr-1" /> Add Task
                </Button>
              </div>
              <Sortable value={checklistFormData.items} onValueChange={(newItems) => setChecklistFormData({ ...checklistFormData, items: newItems })} getItemValue={(item) => (item.id || item.tempId).toString()} className="space-y-2">
                {checklistFormData.items.map((item: any) => (
                  <SortableItem key={item.id || item.tempId} value={(item.id || item.tempId).toString()} className="flex items-center gap-3 p-3 bg-background border rounded-lg group">
                    <SortableItemHandle className="shrink-0 text-muted-foreground/50 hover:text-foreground cursor-grab"><GripVertical className="size-4" /></SortableItemHandle>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium break-words block">{item.title}</span>
                        {item.group_title && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[8px] h-3.5 px-1 uppercase shrink-0 gap-1 font-bold",
                              getPeriodTheme(item.group_title).bg,
                              getPeriodTheme(item.group_title).text,
                              getPeriodTheme(item.group_title).border
                            )}
                          >
                            {(() => {
                              const theme = getPeriodTheme(item.group_title);
                              const ThemeIcon = theme.icon;
                              return <ThemeIcon className="size-2" />;
                            })()}
                            {item.group_title}
                          </Badge>
                        )}
                      </div>
                      {item.instructions && <p className="text-[10px] text-muted-foreground truncate">{item.instructions}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => { setSelectedItem(item); setItemFormData({ ...item, group_id: item.group_id || '', group_title: item.group_title || '' }); setShowItemDialog(true); }}><Edit className="size-3.5" /> </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDeleteItemFromDialog(item)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </SortableItem>
                ))}
              </Sortable>
            </div>
          </div>
          <DialogFooter className="p-6 pt-2 border-t"><Button variant="outline" onClick={() => setShowChecklistDialog(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveChecklist}>Save Checklist</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="size-5 text-primary" />
              {selectedItem ? 'Edit Task' : 'Add Task'}
            </DialogTitle>
            <DialogDescription>Define the specific requirements for this task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Group / Shift Period *</Label>
              <Select 
                value={itemFormData.group_title} 
                onValueChange={(v) => setItemFormData({ ...itemFormData, group_title: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  {['Morning', 'Day', 'Afternoon', 'Night', 'General'].map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Task Title *</Label>
              <Input 
                value={itemFormData.title} 
                onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })} 
                placeholder="e.g. Check Fridge Temps"
                className="h-10 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Instructions</Label>
              <Textarea 
                value={itemFormData.instructions} 
                onChange={(e) => setItemFormData({ ...itemFormData, instructions: e.target.value })} 
                rows={2} 
                placeholder="Optional guide for staff..."
                className="resize-none text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-dashed">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-700">Required Task</span>
                <span className="text-[9px] text-muted-foreground">Staff must check this to complete the checklist</span>
              </div>
              <Checkbox 
                id="itm-req-setup" 
                checked={itemFormData.is_required} 
                onCheckedChange={(c) => setItemFormData({ ...itemFormData, is_required: !!c })} 
              />
            </div>
          </div>
          <DialogFooter className="bg-gray-50 p-6 -m-6 mt-2 border-t rounded-b-lg">
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveItem} className="px-8 font-bold">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {houseId && (
        <HouseChecklistScheduleModal
          open={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedForSchedule(null);
            if (onRefresh) onRefresh();
          }}
          houseId={houseId}
          checklist={selectedForSchedule}
        />
      )}
    </>
  );
}
