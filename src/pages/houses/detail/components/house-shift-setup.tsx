import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Clock, CheckSquare, Download, Info, Zap } from 'lucide-react';
import { useHouseShiftTypes } from '@/hooks/use-house-shift-types';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useHouses } from '@/hooks/use-houses';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn, getPeriodTheme, SHIFT_ICONS } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { supabase } from '@/lib/supabase';
import { PopulateRosterModal } from './PopulateRosterModal';

interface HouseShiftSetupProps {
  houseId: string;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  directSave?: boolean;
}

export function HouseShiftSetup({ houseId, pendingChanges, onPendingChangesChange, directSave = false }: HouseShiftSetupProps) {
  const { shiftTypes, refresh: refreshShiftTypes, defaults } = useHouseShiftTypes(houseId);
  const { houseChecklists } = useHouseChecklists(houseId);
  const { houses: allHouses } = useHouses(0, 100);

  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSourceId, setImportSourceId] = useState<string>('');

  const [editingType, setEditingType] = useState<any | null>(null);

  const [typeFormData, setTypeFormData] = useState({
    name: '',
    short_name: '',
    icon_name: 'Clock',
    color_theme: 'morning',
    default_start_time: '07:00',
    default_end_time: '15:00',
    sort_order: 0,
    is_active: true,
    default_checklists: [] as string[]
  });

  // --- Visibility Logic (Merging current and pending) ---

  const visibleShiftTypes = useMemo(() => {
    if (directSave || !pendingChanges) return shiftTypes;
    
    const dbTypes = shiftTypes.filter(st => !pendingChanges.shiftTypes.toDelete.includes(st.id));
    const merged = dbTypes.map(st => {
      const update = pendingChanges.shiftTypes.toUpdate.find(u => u.id === st.id);
      return update ? { ...st, ...update } : st;
    });
    
    return [...merged, ...pendingChanges.shiftTypes.toAdd];
  }, [shiftTypes, pendingChanges, directSave]);

  const getVisibleDefaults = (shiftTypeId: string) => {
    const dbDefaults = (defaults || []).filter(d => d.shift_type_id === shiftTypeId).map(d => d.checklist_id);
    if (directSave || !pendingChanges) return dbDefaults;
    
    const update = pendingChanges.shiftTypes.toUpdate.find(u => u.id === shiftTypeId);
    if (update && update.default_checklists) return update.default_checklists;
    
    const add = pendingChanges.shiftTypes.toAdd.find(a => a.tempId === shiftTypeId);
    if (add) return add.default_checklists;
    
    return dbDefaults;
  };

  // --- Sorting Logic for Checklists ---

  // Sort checklists for Shift Model (Type) dialog
  const sortedModelChecklists = useMemo(() => {
    return [...(houseChecklists || [])].sort((a, b) => {
      const aSelected = typeFormData.default_checklists?.includes(a.id);
      const bSelected = typeFormData.default_checklists?.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [houseChecklists, typeFormData.default_checklists]);

  // --- Handlers (Updating pendingChanges or Direct Save) ---

  const handleOpenTypeDialog = (type?: any) => {
    if (type) {
      setEditingType(type);
      const checklists = getVisibleDefaults(type.id || type.tempId);
      setTypeFormData({
        name: type.name,
        short_name: type.short_name || '',
        icon_name: type.icon_name || 'Clock',
        color_theme: type.color_theme || 'morning',
        default_start_time: type.default_start_time?.substring(0, 5) || '07:00',
        default_end_time: type.default_end_time?.substring(0, 5) || '15:00',
        sort_order: type.sort_order || 0,
        is_active: type.is_active ?? true,
        default_checklists: checklists
      });
    } else {
      setEditingType(null);
      setTypeFormData({ 
        name: '', 
        short_name: '', 
        icon_name: 'Clock',
        color_theme: 'morning', 
        default_start_time: '07:00', 
        default_end_time: '15:00', 
        sort_order: (visibleShiftTypes?.length || 0) * 10,
        is_active: true,
        default_checklists: [] 
      });
    }
    setShowTypeDialog(true);
  };

  const handleSaveType = async () => {
    if (directSave) {
      try {
        let typeId = editingType?.id;
        const typePayload = {
          house_id: houseId,
          name: typeFormData.name,
          short_name: typeFormData.short_name,
          icon_name: typeFormData.icon_name,
          color_theme: typeFormData.color_theme,
          default_start_time: typeFormData.default_start_time,
          default_end_time: typeFormData.default_end_time,
          sort_order: typeFormData.sort_order,
          is_active: typeFormData.is_active,
          updated_at: new Date().toISOString()
        };

        if (typeId) {
          const { error } = await supabase.from('house_shift_types').update(typePayload).eq('id', typeId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('house_shift_types').insert(typePayload).select().single();
          if (error) throw error;
          typeId = data.id;
        }

        // Sync default checklists
        await supabase.from('shift_type_default_checklists').delete().eq('shift_type_id', typeId);
        if (typeFormData.default_checklists.length > 0) {
          const toInsert = typeFormData.default_checklists.map(clId => ({
            shift_type_id: typeId,
            checklist_id: clId
          }));
          const { error: clErr } = await supabase.from('shift_type_default_checklists').insert(toInsert);
          if (clErr) throw clErr;
        }

        toast.success('Shift model updated');
        refreshShiftTypes();
        setShowTypeDialog(false);
        return;
      } catch (err: any) {
        toast.error(`Failed to save shift model: ${err.message}`);
        return;
      }
    }

    if (!onPendingChangesChange || !pendingChanges) return;

    if (editingType) {
      if (editingType.tempId) {
        onPendingChangesChange({
          ...pendingChanges,
          shiftTypes: {
            ...pendingChanges.shiftTypes,
            toAdd: pendingChanges.shiftTypes.toAdd.map(a => 
              a.tempId === editingType.tempId ? { ...a, ...typeFormData } : a
            )
          }
        });
      } else {
        const update = { id: editingType.id, ...typeFormData };
        onPendingChangesChange({
          ...pendingChanges,
          shiftTypes: {
            ...pendingChanges.shiftTypes,
            toUpdate: [
              ...pendingChanges.shiftTypes.toUpdate.filter(u => u.id !== editingType.id),
              update
            ]
          }
        });
      }
    } else {
      const tempId = `temp-st-${Date.now()}`;
      onPendingChangesChange({
        ...pendingChanges,
        shiftTypes: {
          ...pendingChanges.shiftTypes,
          toAdd: [...pendingChanges.shiftTypes.toAdd, { tempId, ...typeFormData }]
        }
      });
    }
    setShowTypeDialog(false);
  };

  const handleDeleteType = async (type: any) => {
    if (directSave) {
      if (confirm('Delete this shift type? This will also remove any template items linked to it.')) {
        try {
          const { error } = await supabase.from('house_shift_types').delete().eq('id', type.id);
          if (error) throw error;
          toast.success('Shift model removed');
          refreshShiftTypes();
          return;
        } catch (err: any) {
          toast.error(`Failed to delete: ${err.message}`);
          return;
        }
      }
      return;
    }

    if (!onPendingChangesChange || !pendingChanges) return;
    if (type.tempId) {
      onPendingChangesChange({
        ...pendingChanges,
        shiftTypes: {
          ...pendingChanges.shiftTypes,
          toAdd: pendingChanges.shiftTypes.toAdd.filter(a => a.tempId !== type.tempId)
        }
      });
    } else {
      onPendingChangesChange({
        ...pendingChanges,
        shiftTypes: {
          ...pendingChanges.shiftTypes,
          toDelete: [...pendingChanges.shiftTypes.toDelete, type.id]
        }
      });
    }
  };

  const handleImportShiftModel = async () => {
    if (!importSourceId || !onPendingChangesChange || !pendingChanges) return;
    setIsImporting(true);
    try {
      const { data: sourceTypes, error: typesError } = await supabase
        .from('house_shift_types')
        .select('*')
        .eq('house_id', importSourceId);
      
      if (typesError) throw typesError;

      const newToAdd = [];
      for (const st of (sourceTypes || [])) {
        const { data: sourceDefaults } = await supabase
          .from('shift_type_default_checklists')
          .select('checklist:house_checklists(name)')
          .eq('shift_type_id', st.id);
        
        let localChecklistIds: string[] = [];
        if (sourceDefaults && sourceDefaults.length > 0) {
          const checklistNames = sourceDefaults.map((d: any) => d.checklist.name);
          const { data: localChecklists } = await supabase
            .from('house_checklists')
            .select('id, name')
            .eq('house_id', houseId)
            .in('name', checklistNames);
          
          localChecklistIds = (localChecklists || []).map(lc => lc.id);
        }

        newToAdd.push({
          tempId: `temp-st-import-${Date.now()}-${Math.random()}`,
          name: st.name,
          short_name: st.short_name,
          color_theme: st.color_theme,
          default_start_time: st.default_start_time,
          default_end_time: st.default_end_time,
          sort_order: st.sort_order,
          is_active: true,
          default_checklists: localChecklistIds
        });
      }

      onPendingChangesChange({
        ...pendingChanges,
        shiftTypes: {
          ...pendingChanges.shiftTypes,
          toAdd: [...pendingChanges.shiftTypes.toAdd, ...newToAdd]
        }
      });

      toast.success(`Imported ${newToAdd.length} shift types to pending changes.`);
      setShowImportDialog(false);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const renderModel = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Shift Model</h3>
          <p className="text-sm text-muted-foreground">Define work periods and their default checklists.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowPopulateModal(true)} 
            variant="outline" 
            size="sm" 
            className="gap-2 font-bold border-primary/30 text-primary hover:bg-primary/5"
          >
            <Zap className="size-4 fill-primary" /> Populate Roster
          </Button>
          <Button onClick={() => { setImportSourceId(''); setShowImportDialog(true); }} variant="outline" size="sm" className="gap-2 font-bold border-gray-300">
            <Download className="size-4" /> Import Model
          </Button>
          <Button onClick={() => handleOpenTypeDialog()} size="sm" className="gap-2 font-bold">
            <Plus className="size-4" /> Add Shift Type
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleShiftTypes.map(st => {
          const theme = getPeriodTheme(st.name, st.color_theme, st.icon_name);
          const typeDefaults = getVisibleDefaults(st.id || st.tempId);
          const isPendingAdd = !!st.tempId;
          const isPendingUpdate = pendingChanges?.shiftTypes.toUpdate.some(u => u.id === st.id);

          return (
            <div key={st.id || st.tempId} className={cn(
              "bg-white border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all group relative",
              isPendingAdd && "border-dashed border-primary/40 bg-primary/[0.01]",
              isPendingUpdate && "border-primary/40"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("size-10 rounded-lg flex items-center justify-center", theme.bg)}>
                    <theme.icon className={cn("size-5", theme.text)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{st.name}</h4>
                      {(isPendingAdd || isPendingUpdate) && (
                        <Badge variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary border-primary/20">PENDING</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {st.default_start_time?.substring(0, 5)} - {st.default_end_time?.substring(0, 5)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenTypeDialog(st)}>
                    <Edit className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDeleteType(st)}>
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
                    typeDefaults.map(clId => {
                      const defaultInfo = defaults?.find(d => d.checklist_id === clId);
                      const cl = defaultInfo?.checklist || houseChecklists.find(c => c.id === clId);
                      
                      const topItems = cl?.items?.slice(0, 2) || [];

                      return (
                        <div key={clId} className="bg-gray-50/50 border border-gray-100 rounded-lg p-3 group/cl relative">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-[11px] text-gray-900 truncate">{cl?.name || 'Unknown Checklist'}</h5>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                                {topItems.length > 0 ? (
                                  <>
                                    {topItems.map((item: any) => (
                                      <div key={item.id} className="flex items-start gap-2">
                                        <div className="size-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                        <span className="text-[10px] text-gray-600 line-clamp-1 leading-tight">{item.title}</span>
                                      </div>
                                    ))}
                                    {(cl.items?.length || 0) > 2 && (
                                      <p className="text-[9px] text-primary/70 font-bold pl-2.5">
                                        + {(cl.items?.length || 0) - 2} more tasks...
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-[9px] text-muted-foreground italic pl-1">No tasks defined</p>
                                )}
                              </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">None assigned</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {renderModel()}

      <PopulateRosterModal 
        open={showPopulateModal}
        onOpenChange={setShowPopulateModal}
        houseId={houseId}
        houseName={allHouses.find(h => h.id === houseId)?.name || 'this house'}
      />

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
          <DialogHeader className="p-5 pb-3 border-b bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">{editingType ? 'Edit Shift Type' : 'Add Shift Type'}</DialogTitle>
                <DialogDescription className="text-xs font-medium">Define work periods and default checklists.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar bg-gray-50/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shift Name</Label>
                <Input 
                  value={typeFormData.name} 
                  onChange={e => setTypeFormData({...typeFormData, name: e.target.value})} 
                  placeholder="e.g. Morning" 
                  className="h-9 text-sm bg-white" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Short Name</Label>
                <Input 
                  value={typeFormData.short_name} 
                  onChange={e => setTypeFormData({...typeFormData, short_name: e.target.value})} 
                  placeholder="e.g. M" 
                  className="h-9 text-sm bg-white" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Start Time</Label>
                <Input 
                  type="time" 
                  value={typeFormData.default_start_time} 
                  onChange={e => setTypeFormData({...typeFormData, default_start_time: e.target.value})} 
                  className="h-9 text-sm bg-white" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">End Time</Label>
                <Input 
                  type="time" 
                  value={typeFormData.default_end_time} 
                  onChange={e => setTypeFormData({...typeFormData, default_end_time: e.target.value})} 
                  className="h-9 text-sm bg-white" 
                />
              </div>
              <div className="col-span-2 flex items-center pt-5 pl-2">
                <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 w-full justify-between">
                  <Label htmlFor="type-active" className="text-xs font-bold text-gray-600 cursor-pointer uppercase tracking-tight">
                    {typeFormData.is_active ? 'Active' : 'Inactive'} Status
                  </Label>
                  <Switch 
                    id="type-active" 
                    checked={typeFormData.is_active} 
                    onCheckedChange={v => setTypeFormData({...typeFormData, is_active: v})} 
                    className="scale-75 origin-right"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-dashed border-gray-200">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Icon</Label>
                <Select value={typeFormData.icon_name} onValueChange={v => setTypeFormData({...typeFormData, icon_name: v})}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const IconComponent = SHIFT_ICONS[typeFormData.icon_name || 'Clock'] || Clock;
                          return <IconComponent className="size-4 text-primary" />;
                        })()}
                        <span className="text-sm font-medium">{typeFormData.icon_name || 'Select icon'}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(SHIFT_ICONS).map(([name, IconComponent]) => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-3 py-0.5">
                          <IconComponent className="size-4 text-gray-500" />
                          <span className="text-sm">{name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Colour Theme</Label>
                <Select value={typeFormData.color_theme} onValueChange={v => setTypeFormData({...typeFormData, color_theme: v})}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div className={cn("size-3 rounded-full shadow-sm", getPeriodTheme('', typeFormData.color_theme).dot)} />
                        <span className="text-sm font-medium capitalize">{
                          [
                            { id: 'morning', label: 'Amber' },
                            { id: 'day', label: 'Sky' },
                            { id: 'afternoon', label: 'Orange' },
                            { id: 'night', label: 'Indigo' },
                            { id: 'community', label: 'Emerald' },
                            { id: 'other', label: 'Gray' }
                          ].find(c => c.id === typeFormData.color_theme)?.label || 'Select colour'
                        }</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { id: 'morning', label: 'Amber' },
                      { id: 'day', label: 'Sky' },
                      { id: 'afternoon', label: 'Orange' },
                      { id: 'night', label: 'Indigo' },
                      { id: 'community', label: 'Emerald' },
                      { id: 'other', label: 'Gray' }
                    ].map(theme => (
                      <SelectItem key={theme.id} value={theme.id}>
                        <div className="flex items-center gap-2 py-0.5">
                          <div className={cn("size-3 rounded-full shadow-sm", getPeriodTheme('', theme.id).dot)} />
                          <span className="text-sm">{theme.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-dashed border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Default Checklists</Label>
                  <Info className="size-3 text-gray-400" />
                </div>
                {typeFormData.default_checklists?.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20 py-0 h-5">
                    {typeFormData.default_checklists.length} Selected
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(sortedModelChecklists || []).map(cl => {
                  const isSelected = typeFormData.default_checklists?.includes(cl.id);
                  const topItems = cl.items?.slice(0, 2) || [];
                  
                  return (
                    <div 
                      key={cl.id} 
                      className={cn(
                        "cursor-pointer border rounded-xl p-3 transition-all hover:bg-white group flex items-start gap-3",
                        isSelected ? "border-primary bg-primary/[0.03] ring-1 ring-primary/10" : "border-gray-200 bg-white/50"
                      )}
                      onClick={() => {
                        setTypeFormData(prev => ({
                          ...prev,
                          default_checklists: isSelected 
                            ? (prev.default_checklists || []).filter(id => id !== cl.id)
                            : [...(prev.default_checklists || []), cl.id]
                        }));
                      }}
                    >
                      <div className={cn(
                        "size-4 rounded border flex items-center justify-center mt-0.5 shrink-0 transition-all",
                        isSelected ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"
                      )}>
                        {isSelected && <CheckSquare className="size-3" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-gray-900 truncate mb-1">{cl.name}</h5>
                        <div className="space-y-0.5">
                          {topItems.length > 0 ? (
                            <>
                              {topItems.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-1.5">
                                  <div className="size-1 rounded-full bg-gray-300 shrink-0" />
                                  <span className="text-[9px] text-gray-500 truncate leading-tight">{item.title}</span>
                                </div>
                              ))}
                              {(cl.items?.length || 0) > 2 && (
                                <p className="text-[8px] text-primary/70 font-bold pl-2.5">
                                  + {(cl.items?.length || 0) - 2} more
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-[9px] text-muted-foreground italic">Empty</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-white sticky bottom-0 z-10 flex flex-row gap-3">
            <Button variant="ghost" onClick={() => setShowTypeDialog(false)} className="flex-1 font-bold text-xs h-10">Cancel</Button>
            <Button onClick={handleSaveType} className="flex-[2] font-black uppercase tracking-tight text-xs h-10 shadow-lg shadow-primary/20">
              {editingType ? 'Update Model' : 'Add to Model'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Shift Model</DialogTitle>
            <DialogDescription>
              Clones all shift types and their default checklist links from another house.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Source House</Label>
              <Select value={importSourceId} onValueChange={setImportSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select house..." />
                </SelectTrigger>
                <SelectContent>
                  {(allHouses || []).filter(h => h.id !== houseId).map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-xs text-blue-800 leading-relaxed">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p>
                <strong>Note:</strong> This will clone the names and times. Default checklists will only be linked if a checklist with the <strong>exact same name</strong> exists in this house.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onClick={handleImportShiftModel} disabled={!importSourceId || isImporting}>
              {isImporting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Download className="size-4 mr-2" />}
              Import Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
