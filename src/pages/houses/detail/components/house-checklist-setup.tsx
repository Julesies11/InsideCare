import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { checklistsApi } from '@/api/checklists.api';
import { HousePendingChanges } from '@/models/house-pending-changes';
import {
  CheckSquare,
  Clock,
  Download,
  Edit,
  Info,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { STATUS } from '@/config/enums';
import { cn } from '@/lib/utils';
import { useChecklistMaster } from '@/hooks/use-checklist-master';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useHouseShiftTemplates } from '@/hooks/use-house-shift-templates';
import { useActiveHouses } from '@/hooks/use-houses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sortable, SortableItem } from '@/components/ui/sortable';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ChecklistCard } from '@/components/checklists/checklist-card';
import { HouseChecklistScheduleModal } from './HouseChecklistScheduleModal';

interface HouseChecklistSetupProps {
  houseId: string;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  directSave?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onRefresh?: () => void;
}

export function HouseChecklistSetup({
  houseId,
  pendingChanges,
  onPendingChangesChange,
  directSave = false,
  canAdd = true,
  canEdit = true,
  canDelete = true,
  onRefresh,
}: HouseChecklistSetupProps) {
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const [selectedForSchedule, setSelectedForSchedule] = useState<any>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const {
    houseChecklists,
    refresh: refreshChecklists,
    loading,
  } = useHouseChecklists(houseId);
  const { masterChecklists, loading: loadingMaster } = useChecklistMaster();
  const { shiftTemplates } = useHouseShiftTemplates(houseId);
  const { data: allHousesData } = useActiveHouses({
    enabled: showImportDialog,
  });
  const allHouses = allHousesData || [];

  // Import State
  const [importSourceType, setImportSourceType] = useState<'house' | 'master'>(
    'house',
  );
  const [importSourceHouseId, setImportSourceHouseId] = useState<string>('');
  const [sourceChecklists, setSourceChecklists] = useState<any[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [isFetchingSource, setIsFetchingSource] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [checklistFormData, setChecklistFormData] = useState<{
    house_checklist_name: string;
    days_of_week: string[];
    description: string;
    items: any[];
  }>({
    house_checklist_name: '',
    days_of_week: [],
    description: '',
    items: [],
  });

  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    group_id: '',
    group_title: '',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const handleAddChecklist = () => {
    setSelectedChecklist(null);
    setChecklistFormData({
      house_checklist_name: '',
      days_of_week: [],
      description: '',
      items: [],
    });
    setShowChecklistDialog(true);
  };

  const handleEditChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setChecklistFormData({
      house_checklist_name:
        checklist.house_checklist_name || checklist.checklist_name || '',
      days_of_week: checklist.days_of_week || [],
      description: checklist.description || '',
      items: checklist.items || [],
    });
    setShowChecklistDialog(true);
  };

  const visibleChecklists = useMemo(() => {
    if (directSave || !pendingChanges) return houseChecklists;

    const dbChecklists = houseChecklists.filter(
      (cl) => !pendingChanges.checklists.toDelete.includes(cl.id),
    );
    const merged = dbChecklists.map((cl) => {
      const update = pendingChanges.checklists.toUpdate.find(
        (u) => u.id === cl.id,
      );
      return update ? { ...cl, ...update } : cl;
    });

    return [...merged, ...pendingChanges.checklists.toAdd].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );
  }, [houseChecklists, pendingChanges, directSave]);

  const handleSaveChecklist = async () => {
    if (!checklistFormData.house_checklist_name.trim() || !houseId) return;

    const itemsWithUpdatedSortOrder = checklistFormData.items.map(
      (item: any, index: number) => ({
        ...item,
        sort_order: index,
      }),
    );

    if (directSave) {
      try {
        await checklistsApi.upsertChecklist(
          {
            house_id: houseId,
            house_checklist_name: checklistFormData.house_checklist_name,
            days_of_week: checklistFormData.days_of_week,
            description: checklistFormData.description,
            items: itemsWithUpdatedSortOrder,
          },
          selectedChecklist?.tempId ? undefined : selectedChecklist?.id,
        );

        toast.success(
          selectedChecklist ? 'Checklist updated' : 'Checklist added',
        );
        refreshChecklists();
        if (onRefresh) onRefresh();
        setShowChecklistDialog(false);
      } catch (err: any) {
        toast.error(`Failed to save checklist: ${err.message}`);
      }
      return;
    }

    if (!onPendingChangesChange || !pendingChanges) return;

    if (selectedChecklist) {
      if (selectedChecklist.tempId) {
        onPendingChangesChange({
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            toAdd: pendingChanges.checklists.toAdd.map((a) =>
              a.tempId === selectedChecklist.tempId
                ? {
                    ...a,
                    house_checklist_name:
                      checklistFormData.house_checklist_name,
                    days_of_week: checklistFormData.days_of_week,
                    description: checklistFormData.description,
                    items: itemsWithUpdatedSortOrder,
                  }
                : a,
            ),
          },
        });
      } else {
        const update = {
          id: selectedChecklist.id,
          house_checklist_name: checklistFormData.house_checklist_name,
          days_of_week: checklistFormData.days_of_week,
          description: checklistFormData.description,
          items: itemsWithUpdatedSortOrder,
        };

        onPendingChangesChange({
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            toUpdate: [
              ...pendingChanges.checklists.toUpdate.filter(
                (u) => u.id !== selectedChecklist.id,
              ),
              update as any,
            ],
          },
        });
      }
    } else {
      const tempId = `temp-cl-${Date.now()}`;
      onPendingChangesChange({
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: [
            ...pendingChanges.checklists.toAdd,
            {
              tempId,
              house_id: houseId,
              house_checklist_name: checklistFormData.house_checklist_name,
              days_of_week: checklistFormData.days_of_week,
              description: checklistFormData.description,
              sort_order: visibleChecklists.length * 10,
              items: itemsWithUpdatedSortOrder,
            },
          ],
        },
      });
    }
    setShowChecklistDialog(false);
  };

  const handleDeleteChecklist = async (checklist: any) => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;

    if (directSave) {
      try {
        await checklistsApi.deleteChecklist(checklist.id);
        toast.success('Checklist deleted');
        refreshChecklists();
        if (onRefresh) onRefresh();
      } catch (err: any) {
        toast.error(`Failed to delete: ${err.message}`);
      }
      return;
    }

    if (!onPendingChangesChange || !pendingChanges) return;

    if (checklist.tempId) {
      onPendingChangesChange({
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: pendingChanges.checklists.toAdd.filter(
            (a) => a.tempId !== checklist.tempId,
          ),
        },
      });
    } else {
      onPendingChangesChange({
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toDelete: [...pendingChanges.checklists.toDelete, checklist.id],
        },
      });
    }
  };

  const handleAddItemToDialog = () => {
    setSelectedItem(null);
    setItemFormData({
      title: '',
      instructions: '',
      group_id: '',
      group_title: '',
      priority: 'medium',
      is_required: true,
      sort_order: checklistFormData.items.length,
    });
    setShowItemDialog(true);
  };

  const handleSaveItemInDialog = () => {
    if (!itemFormData.title.trim()) return;

    if (selectedItem) {
      setChecklistFormData({
        ...checklistFormData,
        items: checklistFormData.items.map((i) =>
          i === selectedItem ? itemFormData : i,
        ),
      });
    } else {
      setChecklistFormData({
        ...checklistFormData,
        items: [...checklistFormData.items, itemFormData],
      });
    }
    setShowItemDialog(false);
  };

  const handleDeleteItemFromDialog = (item: any) => {
    setChecklistFormData({
      ...checklistFormData,
      items: checklistFormData.items.filter((i) => i !== item),
    });
  };

  const handleFetchSourceChecklists = async (sourceId: string) => {
    if (importSourceType === 'master') {
      const master = masterChecklists.find((m) => m.id === sourceId);
      if (master) {
        setSourceChecklists([master]);
        setSelectedImportIds([master.id]);
      }
      return;
    }

    setImportSourceHouseId(sourceId);
    if (!sourceId) return;

    setIsFetchingSource(true);
    try {
      const data = await checklistsApi.listHouseChecklists(sourceId);
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
      let importCounter = 0;

      for (const id of selectedImportIds) {
        let source;
        if (importSourceType === 'master') {
          source = masterChecklists.find((m) => m.id === id);
        } else {
          source = sourceChecklists.find((cl) => cl.id === id);
        }

        if (!source) continue;

        const checklistData = {
          house_id: houseId,
          house_checklist_name:
            source.house_checklist_name || source.checklist_name || source.name,
          description: source.description,
          master_id:
            importSourceType === 'master'
              ? source.id
              : source.master_id || null,
          sort_order: visibleChecklists.length + importCounter,
          items: (source.items || []).map((item: any) => ({
            tempId: `temp-item-${Date.now()}-${Math.random()}`,
            title: item.title,
            instructions: item.instructions,
            group_title: item.group_title,
            group_id: item.group_id || null,
            priority: item.priority,
            is_required: item.is_required,
            sort_order: item.sort_order,
          })),
        };

        if (directSave) {
          await checklistsApi.upsertChecklist(checklistData);
        } else {
          checklistsToAdd.push({
            ...checklistData,
            tempId: `temp-import-${Date.now()}-${Math.random()}`,
          });
        }
        importCounter++;
      }

      if (!directSave) {
        onPendingChangesChange!({
          ...pendingChanges!,
          checklists: {
            ...pendingChanges!.checklists,
            toAdd: [
              ...(pendingChanges!.checklists?.toAdd || []),
              ...checklistsToAdd,
            ],
          },
        });
      }

      toast.success(
        directSave
          ? 'Checklists imported to database'
          : `Successfully imported ${importCounter} checklists.`,
      );
      if (directSave) refreshChecklists();
      setShowImportDialog(false);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Checklist Setup</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowImportDialog(true)}
            disabled={!canAdd}
          >
            <Download className="size-4" />
            Import
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={handleAddChecklist}
            disabled={!canAdd}
          >
            <Plus className="size-4" />
            Add Checklist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleChecklists.map((checklist, index) => (
          <ChecklistCard
            key={checklist.id || checklist.tempId || index}
            checklist={checklist}
            onEdit={() => handleEditChecklist(checklist)}
            onDelete={() => handleDeleteChecklist(checklist)}
            onSchedule={() => {
              setSelectedForSchedule(checklist);
              setShowScheduleModal(true);
            }}
            isMaster={!!checklist.master_id}
            canDelete={canDelete}
            canEdit={canEdit}
          />
        ))}
        {visibleChecklists.length === 0 && !loading && (
          <div className="col-span-full border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
            No checklists configured for this house.
          </div>
        )}
      </div>

      {/* Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 border-b bg-white">
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">
                {selectedChecklist ? 'Edit Checklist' : 'New House Checklist'}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground">
                Define a routine for this house and its specific tasks.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-gray-50/30 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Checklist Name *
                </Label>
                <Input
                  value={checklistFormData.house_checklist_name}
                  onChange={(e) =>
                    setChecklistFormData({
                      ...checklistFormData,
                      house_checklist_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Morning Routine, Weekly Cleaning"
                  className="bg-white h-10 font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Applicable Days (Optional)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                    (day) => {
                      const isSelected =
                        checklistFormData.days_of_week.includes(day);
                      return (
                        <Badge
                          key={day}
                          variant={isSelected ? 'primary' : 'outline'}
                          className={cn(
                            'cursor-pointer h-7 px-3 text-[10px] font-bold transition-all',
                            isSelected
                              ? 'shadow-sm shadow-primary/20 scale-105'
                              : 'bg-white hover:bg-gray-100 border-gray-200',
                          )}
                          onClick={() => {
                            const newDays = isSelected
                              ? checklistFormData.days_of_week.filter(
                                  (d) => d !== day,
                                )
                              : [...checklistFormData.days_of_week, day];
                            setChecklistFormData({
                              ...checklistFormData,
                              days_of_week: newDays,
                            });
                          }}
                        >
                          {day}
                        </Badge>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Description
              </Label>
              <Textarea
                value={checklistFormData.description}
                onChange={(e) =>
                  setChecklistFormData({
                    ...checklistFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Briefly describe the purpose of this checklist..."
                rows={2}
                className="bg-white resize-none text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
                    Tasks ({checklistFormData.items.length})
                  </h3>
                  <div className="h-1 w-1 rounded-full bg-gray-300" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-primary font-bold hover:bg-primary/5"
                  onClick={handleAddItemToDialog}
                >
                  <Plus className="size-4" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-3">
                <Sortable
                  value={checklistFormData.items}
                  onValueChange={(newItems) =>
                    setChecklistFormData({
                      ...checklistFormData,
                      items: newItems,
                    })
                  }
                  getItemValue={(item) =>
                    (item.tempId || item.id || '').toString()
                  }
                >
                  {checklistFormData.items.map((item, idx) => (
                    <SortableItem
                      key={item.tempId || idx}
                      value={item.tempId || idx.toString()}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white group hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-gray-900 truncate">
                            {item.title}
                          </span>
                          <div className="flex gap-1">
                            {item.is_required && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 border-red-100 text-red-600 bg-red-50 uppercase font-black tracking-tighter"
                              >
                                Required
                              </Badge>
                            )}
                            {item.group_title && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 uppercase font-bold text-blue-600 border-blue-100 bg-blue-50"
                              >
                                {item.group_title}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.instructions && (
                          <p className="text-[10px] text-muted-foreground truncate font-medium">
                            {item.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg"
                          onClick={() => {
                            setSelectedItem(item);
                            setItemFormData({ ...item });
                            setShowItemDialog(true);
                          }}
                        >
                          <Edit className="size-3.5 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg hover:bg-red-50"
                          onClick={() => handleDeleteItemFromDialog(item)}
                        >
                          <Trash2 className="size-3.5 text-red-400" />
                        </Button>
                      </div>
                    </SortableItem>
                  ))}
                </Sortable>

                {checklistFormData.items.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      No tasks added yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-white flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowChecklistDialog(false)}
              className="flex-1 font-bold h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChecklist}
              className="flex-[2] font-black uppercase tracking-tight h-11 shadow-xl shadow-primary/20"
            >
              Save Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-white">
            <div className="flex items-center">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                <CheckSquare className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">
                  {selectedItem ? 'Edit Task' : 'Add Task'}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground">
                  Define the specific requirements for this task.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-4 sm:p-5 bg-gray-50/30">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Task Title *
              </Label>
              <Input
                value={itemFormData.title}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, title: e.target.value })
                }
                placeholder="e.g. Check kitchen cleanliness"
                className="bg-white h-10 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Instructions (Optional)
              </Label>
              <Textarea
                value={itemFormData.instructions}
                onChange={(e) =>
                  setItemFormData({
                    ...itemFormData,
                    instructions: e.target.value,
                  })
                }
                placeholder="Step-by-step guidance for staff..."
                rows={3}
                className="bg-white resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Group / Shift Period
                </Label>
                <Select
                  value={itemFormData.group_id || itemFormData.group_title}
                  onValueChange={(v) => {
                    const template = shiftTemplates.find((t) => t.id === v);
                    setItemFormData({
                      ...itemFormData,
                      group_id: template ? template.id : '',
                      group_title: template ? template.shift_template_name : v,
                    });
                  }}
                >
                  <SelectTrigger className="bg-white h-10">
                    <SelectValue placeholder="Select shift..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.shift_template_name}
                      </SelectItem>
                    ))}
                    {shiftTemplates.length === 0 && (
                      <>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Afternoon">Afternoon</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                        <SelectItem value="Sleepover">Sleepover</SelectItem>
                        <SelectItem value="Daily">General/Daily</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Priority
                </Label>
                <Select
                  value={itemFormData.priority}
                  onValueChange={(v) =>
                    setItemFormData({ ...itemFormData, priority: v })
                  }
                >
                  <SelectTrigger className="bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                  Mandatory Task
                </Label>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Staff must confirm this task is done.
                </p>
              </div>
              <Switch
                checked={itemFormData.is_required}
                onCheckedChange={(v) =>
                  setItemFormData({ ...itemFormData, is_required: v })
                }
                className="scale-90"
              />
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t bg-white flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowItemDialog(false)}
              className="flex-1 font-bold h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveItemInDialog}
              className="flex-[2] font-black uppercase tracking-tight h-10 shadow-lg shadow-primary/10"
            >
              Apply Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-5 text-primary" />
              Import Checklists
            </DialogTitle>
            <DialogDescription>
              Quickly copy existing routines from another house or master
              templates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select
                  value={importSourceType}
                  onValueChange={(v: any) => {
                    setImportSourceType(v);
                    setImportSourceHouseId('');
                    setSourceChecklists([]);
                    setSelectedImportIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">Other House</SelectItem>
                    <SelectItem value="master">Master Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {importSourceType === 'master'
                    ? 'Master Templates'
                    : 'Source House'}
                </Label>
                {importSourceType === 'master' ? (
                  <div className="text-[10px] text-muted-foreground pt-3 italic">
                    Select from global organization-wide templates below.
                  </div>
                ) : (
                  <Select
                    value={importSourceHouseId}
                    onValueChange={handleFetchSourceChecklists}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source house..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allHouses
                        .filter((h) => h.id !== houseId)
                        .map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.house_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {(importSourceHouseId || importSourceType === 'master') && (
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {importSourceType === 'master'
                    ? 'Available Global Templates'
                    : 'Available House Checklists'}
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {isFetchingSource ||
                  (importSourceType === 'master' && loadingMaster) ? (
                    <div className="py-8 text-center text-muted-foreground italic">
                      Fetching checklists...
                    </div>
                  ) : (importSourceType === 'master'
                      ? masterChecklists
                      : sourceChecklists
                    ).length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground italic">
                      No checklists found.
                    </div>
                  ) : (
                    (importSourceType === 'master'
                      ? masterChecklists
                      : sourceChecklists
                    ).map((cl) => (
                      <div
                        key={cl.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                          selectedImportIds.includes(cl.id)
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:bg-gray-50',
                        )}
                        onClick={() => {
                          setSelectedImportIds((prev) =>
                            prev.includes(cl.id)
                              ? prev.filter((id) => id !== cl.id)
                              : [...prev, cl.id],
                          );
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm">
                            {cl.house_checklist_name ||
                              cl.checklist_name ||
                              cl.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {cl.items?.length || 0} tasks
                          </span>
                        </div>
                        <div
                          className={cn(
                            'size-5 rounded-full border flex items-center justify-center transition-all',
                            selectedImportIds.includes(cl.id)
                              ? 'bg-primary border-primary text-white'
                              : 'border-gray-300',
                          )}
                        >
                          {selectedImportIds.includes(cl.id) && (
                            <Plus className="size-3" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImportChecklists}
              disabled={selectedImportIds.length === 0 || isImporting}
              className="gap-2"
            >
              {isImporting ? <Loader2 className="size-4 animate-spin" /> : null}
              {isImporting
                ? 'Importing...'
                : `Import Selected (${selectedImportIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HouseChecklistScheduleModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        checklist={selectedForSchedule}
        houseId={houseId}
        onSuccess={() => {
          refreshChecklists();
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
