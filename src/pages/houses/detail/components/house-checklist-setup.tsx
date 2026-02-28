import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, CheckSquare, GripVertical, Loader2, ChevronDown, Copy } from 'lucide-react';
import { useHouseChecklists } from '@/hooks/useHouseChecklists';
import { useChecklistMaster } from '@/hooks/useChecklistMaster';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChecklistCard } from '@/components/checklists/checklist-card';

interface HouseChecklistSetupProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseChecklistSetup({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseChecklistSetupProps) {
  const { houseChecklists, loading } = useHouseChecklists(houseId);
  const { masterChecklists, loading: loadingMaster } = useChecklistMaster();
  
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [checklistFormData, setChecklistFormData] = useState<any>({
    name: '',
    frequency: 'daily',
    description: '',
    items: [],
  });

  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const handleAddChecklist = () => {
    setSelectedChecklist(null);
    setChecklistFormData({
      name: '',
      frequency: 'daily',
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
      description: checklist.description || '',
      items: checklist.items || [],
    });
    setShowChecklistDialog(true);
  };

  const handleSaveChecklist = () => {
    if (!checklistFormData.name.trim() || !pendingChanges || !onPendingChangesChange) return;

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
      items: (template.items || []).map((item: any) => ({
        tempId: `temp-item-${Date.now()}-${Math.random()}`,
        master_item_id: item.id,
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

  const visibleChecklists = [
    ...houseChecklists
      .filter(checklist => !pendingChanges?.checklists.toDelete.includes(checklist.id))
      .map(checklist => {
        const update = pendingChanges?.checklists.toUpdate.find(u => u.id === checklist.id);
        return update ? { ...checklist, ...update } : checklist;
      }),
    ...(pendingChanges?.checklists.toAdd || []),
  ];

  return (
    <>
      <div className="flex flex-col gap-5 lg:gap-7.5" id="checklists">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="size-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Checklist Setup</h2>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="border border-gray-300" disabled={!houseId || !canAdd}>
                <Plus className="size-4 me-1.5" />
                Add Checklist
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
          <div className="py-12 text-center text-muted-foreground">Loading checklists...</div>
        ) : visibleChecklists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <CheckSquare className="size-12 mb-4 opacity-20" />
              <p>No checklists configured for this house</p>
              <p className="text-xs">Staff use these to start daily or weekly tasks</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleChecklists.map((checklist) => {
              const isPendingAdd = 'tempId' in checklist;
              const isPendingUpdate = pendingChanges?.checklists.toUpdate.some(c => c.id === (checklist as any).id);
              const isPendingDelete = pendingChanges?.checklists.toDelete.includes((checklist as any).id);

              return (
                <ChecklistCard 
                  key={(checklist as any).id || (checklist as any).tempId}
                  checklist={checklist}
                  isPendingAdd={isPendingAdd}
                  isPendingUpdate={isPendingUpdate}
                  isPendingDelete={isPendingDelete}
                  onEdit={handleEditChecklist}
                  onDelete={handleDeleteChecklist}
                  footer={
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 text-xs shadow-sm w-full mt-3"
                      onClick={() => handleEditChecklist(checklist)}
                    >
                      <Edit className="size-3.5 me-1.5" />
                      Edit Checklist
                    </Button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{selectedChecklist ? 'Edit Checklist' : 'Add Checklist'}</DialogTitle>
            <DialogDescription>Define the tasks for this house-specific checklist.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="setup-name">Name *</Label>
                <Input id="setup-name" value={checklistFormData.name} onChange={(e) => setChecklistFormData({ ...checklistFormData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-freq">Frequency *</Label>
                <Select value={checklistFormData.frequency} onValueChange={(v) => setChecklistFormData({ ...checklistFormData, frequency: v })}>
                  <SelectTrigger id="setup-freq"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-desc">Description</Label>
              <Textarea id="setup-desc" value={checklistFormData.description} onChange={(e) => setChecklistFormData({ ...checklistFormData, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Tasks</Label>
                <Button variant="outline" size="sm" onClick={() => { setSelectedItem(null); setItemFormData({ title: '', instructions: '', priority: 'medium', is_required: true, sort_order: checklistFormData.items.length }); setShowItemDialog(true); }}>
                  <Plus className="size-3.5 mr-1" /> Add Task
                </Button>
              </div>
              <Sortable value={checklistFormData.items} onValueChange={(newItems) => setChecklistFormData({ ...checklistFormData, items: newItems })} getItemValue={(item) => (item.id || item.tempId).toString()} className="space-y-2">
                {checklistFormData.items.map((item: any) => (
                  <SortableItem key={item.id || item.tempId} value={(item.id || item.tempId).toString()} className="flex items-center gap-3 p-3 bg-background border rounded-lg group">
                    <SortableItemHandle className="shrink-0 text-muted-foreground/50 hover:text-foreground cursor-grab"><GripVertical className="size-4" /></SortableItemHandle>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{item.title}</span>
                      {item.instructions && <p className="text-[10px] text-muted-foreground truncate">{item.instructions}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => { setSelectedItem(item); setItemFormData({ ...item }); setShowItemDialog(true); }}><Edit className="size-3.5" /> </Button>
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

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add from Template</DialogTitle><DialogDescription>Select a master template to clone to this house.</DialogDescription></DialogHeader>
          <div className="py-4">
            {loadingMaster ? <div className="py-12 text-center"><Loader2 className="size-8 animate-spin mx-auto mb-2 text-primary" /></div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {masterChecklists.map(template => (
                  <button key={template.id} onClick={() => handleSelectTemplate(template)} className="flex flex-col text-left p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group">
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{template.name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">{template.frequency}</Badge>
                    </div>
                    {template.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.description}</p>}
                    <div className="mt-auto text-[10px] font-medium text-gray-500">{template.items?.length || 0} tasks</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedItem ? 'Edit Task' : 'Add Task'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={itemFormData.title} onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Instructions</Label><Textarea value={itemFormData.instructions} onChange={(e) => setItemFormData({ ...itemFormData, instructions: e.target.value })} rows={2} /></div>
            <div className="flex items-center gap-2"><Checkbox id="itm-req-setup" checked={itemFormData.is_required} onCheckedChange={(c) => setItemFormData({ ...itemFormData, is_required: !!c })} /><Label htmlFor="itm-req-setup">Required Task</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveItem}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
