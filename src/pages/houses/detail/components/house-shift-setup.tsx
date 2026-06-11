import { useEffect, useMemo, useState } from 'react';
import { shiftTemplatesApi } from '@/api/shift-templates.api';
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
import { cn, getPeriodTheme } from '@/lib/utils';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useHouseShiftTemplates } from '@/hooks/use-house-shift-templates';
import { useActiveHouses } from '@/hooks/use-houses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Switch } from '@/components/ui/switch';

interface HouseShiftSetupProps {
  houseId: string;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  directSave?: boolean;
  canEdit?: boolean;
  refreshKey?: number;
}

export function HouseShiftSetup({
  houseId,
  pendingChanges,
  onPendingChangesChange,
  directSave = false,
  canEdit: _canEdit,
  refreshKey,
}: HouseShiftSetupProps) {
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSourceId, setImportSourceId] = useState<string>('');
  const [houseShiftCounts, setHouseShiftCounts] = useState<
    Record<string, number>
  >({});
  const [editingType, setEditingType] = useState<any | null>(null);

  const {
    shiftTemplates,
    refresh: refreshShiftTemplates,
    defaults,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
  } = useHouseShiftTemplates(houseId);
  const { houseChecklists } = useHouseChecklists(houseId);

  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      refreshShiftTemplates();
    }
  }, [refreshKey, refreshShiftTemplates]);

  const { data: allHousesData } = useActiveHouses({
    enabled: showImportDialog,
  });
  const allHouses = allHousesData || [];

  // Fetch shift template counts for the import dialog
  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      if (!showImportDialog || allHouses.length === 0) return;

      try {
        const counts = await shiftTemplatesApi.getTemplateCountPerHouse();
        if (!mounted) return;
        setHouseShiftCounts(counts);
      } catch (err) {
        console.error('Error fetching shift counts:', err);
      }
    };

    fetchCounts();
    return () => {
      mounted = false;
    };
  }, [showImportDialog, allHouses.length]);

  const [typeFormData, setTypeFormData] = useState({
    shift_template_name: '',
    short_name: '',
    icon_name: 'Clock',
    color_theme: 'morning',
    default_start_time: '07:00',
    default_end_time: '15:00',
    sort_order: 0,
    is_active: true,
    default_checklists: [] as string[],
  });

  const visibleShiftTemplates = useMemo(() => {
    if (directSave || !pendingChanges?.shiftTemplates) return shiftTemplates;

    const dbTypes = shiftTemplates.filter(
      (st) => !pendingChanges.shiftTemplates?.toDelete?.includes(st.id),
    );
    const merged = dbTypes.map((st) => {
      const update = pendingChanges.shiftTemplates?.toUpdate?.find(
        (u) => u.id === st.id,
      );
      return update ? { ...st, ...update } : st;
    });

    return [...merged, ...(pendingChanges.shiftTemplates?.toAdd || [])];
  }, [shiftTemplates, pendingChanges, directSave]);

  const getVisibleDefaults = (shiftTemplateId: string) => {
    const dbDefaults = (defaults || [])
      .filter((d) => d.shift_template_id === shiftTemplateId)
      .map((d) => d.checklist_id);
    if (directSave || !pendingChanges || !pendingChanges.shiftTemplates)
      return dbDefaults;

    const update = pendingChanges.shiftTemplates.toUpdate?.find(
      (u) => u.id === shiftTemplateId,
    );
    if (update && update.default_checklists) return update.default_checklists;

    const add = pendingChanges.shiftTemplates.toAdd?.find(
      (a) => a.tempId === shiftTemplateId,
    );
    if (add) return add.default_checklists;

    return dbDefaults;
  };

  const sortedModelChecklists = useMemo(() => {
    return [...(houseChecklists || [])].sort((a, b) => {
      const aSelected = typeFormData.default_checklists?.includes(a.id);
      const bSelected = typeFormData.default_checklists?.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [houseChecklists, typeFormData.default_checklists]);

  const handleOpenTypeDialog = (type?: any) => {
    if (type) {
      setEditingType(type);
      const checklists = getVisibleDefaults(type.id || type.tempId);
      setTypeFormData({
        shift_template_name: type.shift_template_name || '',
        short_name: type.short_name || '',
        icon_name: type.icon_name || 'Clock',
        color_theme: type.color_theme || 'morning',
        default_start_time: type.default_start_time?.substring(0, 5) || '07:00',
        default_end_time: type.default_end_time?.substring(0, 5) || '15:00',
        sort_order: type.sort_order || 0,
        is_active: type.is_active ?? true,
        default_checklists: checklists,
      });
    } else {
      setEditingType(null);
      setTypeFormData({
        shift_template_name: '',
        short_name: '',
        icon_name: 'Clock',
        color_theme: 'morning',
        default_start_time: '07:00',
        default_end_time: '15:00',
        sort_order: (visibleShiftTemplates?.length || 0) * 10,
        is_active: true,
        default_checklists: [],
      });
    }
    setShowTypeDialog(true);
  };

  const handleSaveType = async () => {
    if (!typeFormData.shift_template_name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      if (directSave) {
        if (editingType) {
          await updateShiftTemplate.mutateAsync({
            ...typeFormData,
            id: editingType.id,
            house_id: houseId,
          });
        } else {
          await createShiftTemplate.mutateAsync({
            ...typeFormData,
            house_id: houseId,
          });
        }
      } else {
        if (!onPendingChangesChange || !pendingChanges) return;

        if (editingType) {
          if (editingType.tempId) {
            onPendingChangesChange({
              ...pendingChanges,
              shiftTemplates: {
                ...pendingChanges.shiftTemplates,
                toAdd: pendingChanges.shiftTemplates.toAdd.map((a) =>
                  a.tempId === editingType.tempId
                    ? { ...a, ...typeFormData }
                    : a,
                ),
              },
            });
          } else {
            onPendingChangesChange({
              ...pendingChanges,
              shiftTemplates: {
                ...pendingChanges.shiftTemplates,
                toUpdate: [
                  ...pendingChanges.shiftTemplates.toUpdate.filter(
                    (u) => u.id !== editingType.id,
                  ),
                  { id: editingType.id, ...typeFormData },
                ],
              },
            });
          }
        } else {
          onPendingChangesChange({
            ...pendingChanges,
            shiftTemplates: {
              ...pendingChanges.shiftTemplates,
              toAdd: [
                ...pendingChanges.shiftTemplates.toAdd,
                { tempId: `temp-st-${Date.now()}`, ...typeFormData },
              ],
            },
          });
        }
      }
      setShowTypeDialog(false);
    } catch (err: any) {
      toast.error(`Failed to save shift template: ${err.message}`);
    }
  };

  const handleDeleteType = async (type: any) => {
    if (!confirm('Delete this shift template?')) return;

    try {
      if (directSave) {
        await deleteShiftTemplate.mutateAsync(type.id);
      } else {
        if (!onPendingChangesChange || !pendingChanges) return;
        if (type.tempId) {
          onPendingChangesChange({
            ...pendingChanges,
            shiftTemplates: {
              ...pendingChanges.shiftTemplates,
              toAdd: pendingChanges.shiftTemplates.toAdd.filter(
                (a) => a.tempId !== type.tempId,
              ),
            },
          });
        } else {
          onPendingChangesChange({
            ...pendingChanges,
            shiftTemplates: {
              ...pendingChanges.shiftTemplates,
              toDelete: [...pendingChanges.shiftTemplates.toDelete, type.id],
            },
          });
        }
      }
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const handleImportShiftTemplates = async () => {
    if (!importSourceId) return;
    setIsImporting(true);
    try {
      if (directSave) {
        await shiftTemplatesApi.importFromHouse(houseId, importSourceId);
        toast.success('Shift templates imported');
        refreshShiftTemplates();
      } else {
        if (!onPendingChangesChange || !pendingChanges) return;
        // (Pending import logic can be implemented here if needed)
      }
      setShowImportDialog(false);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Shift Templates</h3>
          <p className="text-sm text-muted-foreground">
            Define work periods and their default checklists.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setImportSourceId('');
              setShowImportDialog(true);
            }}
            disabled={!_canEdit}
            variant="outline"
            size="sm"
            className="gap-2 font-bold border-gray-300"
          >
            <Download className="size-4" /> Import Templates
          </Button>
          <Button
            onClick={() => handleOpenTypeDialog()}
            disabled={!_canEdit}
            size="sm"
            className="gap-2 font-bold"
          >
            <Plus className="size-4" /> Add Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleShiftTemplates.map((st) => {
          const theme = getPeriodTheme(
            st.shift_template_name,
            st.color_theme,
            st.icon_name,
          );
          const typeDefaults = getVisibleDefaults(st.id || st.tempId);
          const isPendingAdd = !!st.tempId;
          const isPendingUpdate =
            pendingChanges?.shiftTemplates?.toUpdate?.some(
              (u) => u.id === st.id,
            );

          return (
            <div
              key={st.id || st.tempId}
              className={cn(
                'bg-white border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all group relative',
                isPendingAdd &&
                  'border-dashed border-primary/40 bg-primary/[0.01]',
                isPendingUpdate && 'border-primary/40',
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'size-10 rounded-lg flex items-center justify-center',
                      theme.bg,
                    )}
                  >
                    <theme.icon className={cn('size-5', theme.text)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">
                        {st.shift_template_name}
                      </h4>
                      {(isPendingAdd || isPendingUpdate) && (
                        <Badge
                          variant="outline"
                          className="text-[8px] h-4 bg-primary/5 text-primary border-primary/20"
                        >
                          PENDING
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {st.default_start_time?.substring(0, 5)} -{' '}
                      {st.default_end_time?.substring(0, 5)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleOpenTypeDialog(st)}
                    disabled={!_canEdit}
                    aria-label="edit"
                  >
                    <Edit className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => handleDeleteType(st)}
                    disabled={!_canEdit}
                    aria-label="delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dashed">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckSquare className="size-3" /> Default Checklists
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {typeDefaults.length > 0 ? (
                    typeDefaults.map((clId) => {
                      const defaultInfo = defaults?.find(
                        (d) => d.checklist_id === clId,
                      );
                      const cl =
                        houseChecklists.find((c) => c.id === clId) ||
                        defaultInfo?.checklist;

                      const topItems = cl?.items?.slice(0, 2) || [];

                      return (
                        <div
                          key={clId}
                          className="bg-gray-50/50 border border-gray-100 rounded-lg p-3 group/cl relative"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-[11px] text-gray-900 truncate">
                                {cl?.house_checklist_name ||
                                  'Unknown Checklist'}
                              </h5>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {topItems.length > 0 ? (
                              <>
                                {topItems.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-2"
                                  >
                                    <div className="size-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                    <span className="text-[10px] text-gray-600 line-clamp-1 leading-tight">
                                      {item.title}
                                    </span>
                                  </div>
                                ))}
                                {(cl.items?.length || 0) > 2 && (
                                  <p className="text-[9px] text-primary/70 font-bold pl-2.5">
                                    + {(cl.items?.length || 0) - 2} more
                                    tasks...
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-[9px] text-muted-foreground italic pl-1">
                                No tasks defined
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">
                      None assigned
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Shift Template' : 'Add Shift Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="shift_template_name">Template Name</Label>
              <Input
                id="shift_template_name"
                value={typeFormData.shift_template_name}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    shift_template_name: e.target.value,
                  })
                }
                placeholder="e.g. Morning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_name">Short Name</Label>
              <Input
                id="short_name"
                value={typeFormData.short_name}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    short_name: e.target.value,
                  })
                }
                placeholder="e.g. M"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_start_time">Start Time</Label>
              <Input
                id="default_start_time"
                type="time"
                value={typeFormData.default_start_time}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    default_start_time: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_end_time">End Time</Label>
              <Input
                id="default_end_time"
                type="time"
                value={typeFormData.default_end_time}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    default_end_time: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="is_active"
                checked={typeFormData.is_active}
                onCheckedChange={(v) =>
                  setTypeFormData({ ...typeFormData, is_active: v })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Default Checklists</Label>
            <div className="grid grid-cols-2 gap-2">
              {sortedModelChecklists.map((cl) => {
                const isSelected = typeFormData.default_checklists?.includes(
                  cl.id,
                );
                return (
                  <div
                    key={cl.id}
                    className={cn(
                      'cursor-pointer p-2 border rounded-lg flex items-center justify-between',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-gray-50',
                    )}
                    onClick={() => {
                      setTypeFormData((prev) => ({
                        ...prev,
                        default_checklists: isSelected
                          ? prev.default_checklists.filter((id) => id !== cl.id)
                          : [...prev.default_checklists, cl.id],
                      }));
                    }}
                  >
                    <span className="text-sm truncate">
                      {cl.house_checklist_name}
                    </span>
                    <Checkbox checked={isSelected} readOnly />
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveType}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Shift Templates</DialogTitle>
            <DialogDescription>
              Clone templates from another house.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label>Source House</Label>
            <Select value={importSourceId} onValueChange={setImportSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select house..." />
              </SelectTrigger>
              <SelectContent>
                {allHouses
                  .filter((h) => h.id !== houseId)
                  .map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.house_name} ({houseShiftCounts[h.id] || 0})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportShiftTemplates}
              disabled={!importSourceId || isImporting}
            >
              {isImporting ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Download className="size-4 mr-2" />
              )}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
