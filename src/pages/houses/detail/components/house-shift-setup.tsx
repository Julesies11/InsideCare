import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Clock, Loader2, Settings2, CheckSquare, Download, Info, CalendarDays, Play, Repeat, Zap } from 'lucide-react';
import { useHouseShiftTypes } from '@/hooks/use-house-shift-types';
import { useShiftTemplates } from '@/hooks/use-shift-templates';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useHouseParticipants } from '@/hooks/useHouseParticipants';
import { useHouses } from '@/hooks/use-houses';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn, getPeriodTheme, SHIFT_ICONS } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { supabase } from '@/lib/supabase';
import { useRosterData } from '@/components/roster/use-roster-data';
import { PopulateRosterModal } from './PopulateRosterModal';

interface HouseShiftSetupProps {
  houseId: string;
  mode?: 'model' | 'templates' | 'both';
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
  directSave?: boolean;
}

export function HouseShiftSetup({ houseId, mode = 'both', pendingChanges, onPendingChangesChange, directSave = false }: HouseShiftSetupProps) {
  const { shiftTypes, refresh: refreshShiftTypes } = useHouseShiftTypes(houseId);
  const { defaults, groups, schedules, refresh: refreshTemplates, createSchedule, deleteSchedule } = useShiftTemplates(houseId);
  const { houseChecklists } = useHouseChecklists(houseId);
  const { houses: allHouses } = useHouses(0, 100);
  const { participants: houseParticipants } = useHouseParticipants(houseId);
  const { materializeTemplate } = useRosterData();

  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSourceId, setImportSourceId] = useState<string>('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [isApplyingSchedule, setIsApplyingSchedule] = useState<string | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    template_group_id: '',
    start_date: '',
    end_date: '',
    recurrence: 'once',
    is_active: true,
  });

  const [editingType, setEditingType] = useState<any | null>(null);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

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

  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    selected_type_ids: [] as string[]
  });

  const [itemFormData, setItemFormData] = useState({
    shift_type_id: '',
    start_time: '07:00',
    end_time: '15:00',
    checklist_ids: [] as string[],
    participant_ids: [] as string[]
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

  const visibleGroups = useMemo(() => {
    if (directSave || !pendingChanges) return groups;
    
    const dbGroups = (groups || []).filter(g => !pendingChanges.shiftTemplateGroups.toDelete.includes(g.id));
    const merged = dbGroups.map(g => {
      const update = pendingChanges.shiftTemplateGroups.toUpdate.find(u => u.id === g.id);
      const mergedGroup = update ? { ...g, ...update } : g;
      
      // Handle items visibility for DB groups
      const currentItems = (mergedGroup.items || []).filter(i => !pendingChanges.shiftTemplateGroups.items.toDelete.includes(i.id));
      const updatedItems = currentItems.map(i => {
        const itemUpdate = pendingChanges.shiftTemplateGroups.items.toUpdate.find(u => u.id === i.id);
        return itemUpdate ? { ...i, ...itemUpdate } : i;
      });
      const addedItems = pendingChanges.shiftTemplateGroups.items.toAdd.filter(i => i.template_group_id === g.id);
      
      return { ...mergedGroup, items: [...updatedItems, ...addedItems] };
    });
    
    return [...merged, ...pendingChanges.shiftTemplateGroups.toAdd];
  }, [groups, pendingChanges, directSave]);

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

  // Sort checklists for Template Item (Shift) dialog
  const sortedItemChecklists = useMemo(() => {
    return [...(houseChecklists || [])].sort((a, b) => {
      const aSelected = itemFormData.checklist_ids?.includes(a.id);
      const bSelected = itemFormData.checklist_ids?.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [houseChecklists, itemFormData.checklist_ids]);

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

  const handleSaveGroup = async () => {
    if (directSave) {
      try {
        const { data: newGroup, error: groupError } = await supabase
          .from('shift_template_groups')
          .insert({
            house_id: houseId,
            name: groupFormData.name,
            description: groupFormData.description
          })
          .select()
          .single();
        
        if (groupError) throw groupError;

        if (groupFormData.selected_type_ids.length > 0) {
          for (const typeId of groupFormData.selected_type_ids) {
            const type = visibleShiftTypes.find(t => (t.id || t.tempId) === typeId);
            const { data: newItem, error: itemError } = await supabase
              .from('shift_template_items')
              .insert({
                template_group_id: newGroup.id,
                shift_type_id: typeId,
                start_time: type?.default_start_time || '07:00',
                end_time: type?.default_end_time || '15:00'
              })
              .select()
              .single();
            
            if (itemError) throw itemError;

            // Link default checklists
            const typeDefaults = getVisibleDefaults(typeId);
            if (typeDefaults.length > 0) {
              const toInsert = typeDefaults.map(clId => ({
                shift_template_item_id: newItem.id,
                checklist_id: clId
              }));
              await supabase.from('shift_template_item_checklists').insert(toInsert);
            }
          }
        }

        toast.success('Template group created');
        refreshTemplates();
        setShowTemplateDialog(false);
        setGroupFormData({ name: '', description: '', selected_type_ids: [] });
        return;
      } catch (err: any) {
        toast.error(`Failed to create template: ${err.message}`);
        return;
      }
    }

    if (!onPendingChangesChange || !pendingChanges) return;

    const tempItems = groupFormData.selected_type_ids.map(typeId => {
      const type = visibleShiftTypes.find(t => (t.id || t.tempId) === typeId);
      return {
        tempId: `temp-item-${Date.now()}-${Math.random()}`,
        shift_type_id: typeId,
        start_time: type?.default_start_time?.substring(0, 5) || '07:00',
        end_time: type?.default_end_time?.substring(0, 5) || '15:00',
        checklist_ids: getVisibleDefaults(typeId)
      };
    });

    const tempId = `temp-group-${Date.now()}`;
    onPendingChangesChange({
      ...pendingChanges,
      shiftTemplateGroups: {
        ...pendingChanges.shiftTemplateGroups,
        toAdd: [...pendingChanges.shiftTemplateGroups.toAdd, { 
          tempId, 
          name: groupFormData.name, 
          description: groupFormData.description,
          items: tempItems
        }]
      }
    });
    
    setShowTemplateDialog(false);
    setGroupFormData({ name: '', description: '', selected_type_ids: [] });
  };

  const handleDeleteGroup = async (group: any) => {
    if (directSave) {
      if (confirm('Delete this template group?')) {
        try {
          const { error } = await supabase.from('shift_template_groups').delete().eq('id', group.id);
          if (error) throw error;
          toast.success('Template removed');
          refreshTemplates();
          return;
        } catch (err: any) {
          toast.error(`Failed to delete template: ${err.message}`);
          return;
        }
      }
      return;
    }

    if (!onPendingChangesChange || !pendingChanges) return;
    if (group.tempId) {
      onPendingChangesChange({
        ...pendingChanges,
        shiftTemplateGroups: {
          ...pendingChanges.shiftTemplateGroups,
          toAdd: pendingChanges.shiftTemplateGroups.toAdd.filter(a => a.tempId !== group.tempId)
        }
      });
    } else {
      onPendingChangesChange({
        ...pendingChanges,
        shiftTemplateGroups: {
          ...pendingChanges.shiftTemplateGroups,
          toDelete: [...pendingChanges.shiftTemplateGroups.toDelete, group.id]
        }
      });
    }
  };

  const handleOpenItemDialog = (group: any, item?: any) => {
    setEditingGroup(group);
    if (item) {
      setEditingItem(item);
      setItemFormData({
        shift_type_id: item.shift_type_id || '',
        start_time: item.start_time?.substring(0, 5) || '07:00',
        end_time: item.end_time?.substring(0, 5) || '15:00',
        checklist_ids: item.checklist_ids || item.checklists?.map((c: any) => c.checklist_id) || [],
        participant_ids: item.participant_ids || item.participants?.map((p: any) => p.participant_id) || []
      });
    } else {
      setEditingItem(null);
      setItemFormData({ shift_type_id: '', start_time: '07:00', end_time: '15:00', checklist_ids: [], participant_ids: [] });
    }
    setShowItemDialog(true);
  };

  const handleSaveItem = async () => {
    if (directSave && editingGroup) {
      try {
        let itemId = editingItem?.id;
        const itemPayload = {
          template_group_id: editingGroup.id,
          shift_type_id: itemFormData.shift_type_id,
          start_time: itemFormData.start_time,
          end_time: itemFormData.end_time,
          updated_at: new Date().toISOString()
        };

        if (itemId) {
          const { error } = await supabase.from('shift_template_items').update(itemPayload).eq('id', itemId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('shift_template_items').insert(itemPayload).select().single();
          if (error) throw error;
          itemId = data.id;
        }

        // Sync checklists
        await supabase.from('shift_template_item_checklists').delete().eq('shift_template_item_id', itemId);
        if (itemFormData.checklist_ids.length > 0) {
          const toInsert = itemFormData.checklist_ids.map(clId => ({
            shift_template_item_id: itemId,
            checklist_id: clId
          }));
          const { error: clErr } = await supabase.from('shift_template_item_checklists').insert(toInsert);
          if (clErr) throw clErr;
        }

        // Sync participants
        await supabase.from('shift_template_item_participants').delete().eq('shift_template_item_id', itemId);
        if (itemFormData.participant_ids.length > 0) {
          const pToInsert = itemFormData.participant_ids.map(pId => ({
            shift_template_item_id: itemId,
            participant_id: pId
          }));
          const { error: pErr } = await supabase.from('shift_template_item_participants').insert(pToInsert);
          if (pErr) throw pErr;
        }

        toast.success('Template shift updated');
        refreshTemplates();
        setShowItemDialog(false);
        return;
      } catch (err: any) {
        toast.error(`Failed to save template shift: ${err.message}`);
        return;
      }
    }

    if (!onPendingChangesChange || !pendingChanges || !editingGroup) return;

    if (editingGroup.tempId) {
      // Modifying items inside a pending group
      const updatedGroup = {
        ...editingGroup,
        items: editingItem 
          ? editingGroup.items.map((i: any) => (i.tempId === editingItem.tempId ? { ...i, ...itemFormData } : i))
          : [...editingGroup.items, { tempId: `temp-item-${Date.now()}`, ...itemFormData }]
      };
      onPendingChangesChange({
        ...pendingChanges,
        shiftTemplateGroups: {
          ...pendingChanges.shiftTemplateGroups,
          toAdd: pendingChanges.shiftTemplateGroups.toAdd.map(a => a.tempId === editingGroup.tempId ? updatedGroup : a)
        }
      });
    } else {
      // Modifying items for a DB group
      if (editingItem) {
        if (editingItem.tempId) {
          onPendingChangesChange({
            ...pendingChanges,
            shiftTemplateGroups: {
              ...pendingChanges.shiftTemplateGroups,
              items: {
                ...pendingChanges.shiftTemplateGroups.items,
                toAdd: pendingChanges.shiftTemplateGroups.items.toAdd.map(a => 
                  a.tempId === editingItem.tempId ? { ...a, ...itemFormData } : a
                )
              }
            }
          });
        } else {
          onPendingChangesChange({
            ...pendingChanges,
            shiftTemplateGroups: {
              ...pendingChanges.shiftTemplateGroups,
              items: {
                ...pendingChanges.shiftTemplateGroups.items,
                toUpdate: [
                  ...pendingChanges.shiftTemplateGroups.items.toUpdate.filter(u => u.id !== editingItem.id),
                  { id: editingItem.id, ...itemFormData }
                ]
              }
            }
          });
        }
      } else {
        onPendingChangesChange({
          ...pendingChanges,
          shiftTemplateGroups: {
            ...pendingChanges.shiftTemplateGroups,
            items: {
              ...pendingChanges.shiftTemplateGroups.items,
              toAdd: [...pendingChanges.shiftTemplateGroups.items.toAdd, { 
                tempId: `temp-item-${Date.now()}`, 
                template_group_id: editingGroup.id, 
                ...itemFormData 
              }]
            }
          }
        });
      }
    }
    setShowItemDialog(false);
  };

  const handleDeleteItem = async (group: any, item: any) => {
    if (directSave) {
      if (confirm('Remove this shift from the template?')) {
        try {
          const { error } = await supabase.from('shift_template_items').delete().eq('id', item.id);
          if (error) throw error;
          toast.success('Shift removed from template');
          refreshTemplates();
          return;
        } catch (err: any) {
          toast.error(`Failed to remove shift: ${err.message}`);
          return;
        }
      }
      return;
    }

    if (!onPendingChangesChange || !pendingChanges) return;
    
    if (group.tempId) {
      const updatedGroup = {
        ...group,
        items: group.items.filter((i: any) => i.tempId !== item.tempId)
      };
      onPendingChangesChange({
        ...pendingChanges,
        shiftTemplateGroups: {
          ...pendingChanges.shiftTemplateGroups,
          toAdd: pendingChanges.shiftTemplateGroups.toAdd.map(a => a.tempId === group.tempId ? updatedGroup : a)
        }
      });
    } else {
      if (item.tempId) {
        onPendingChangesChange({
          ...pendingChanges,
          shiftTemplateGroups: {
            ...pendingChanges.shiftTemplateGroups,
            items: {
              ...pendingChanges.shiftTemplateGroups.items,
              toAdd: pendingChanges.shiftTemplateGroups.items.toAdd.filter(a => a.tempId !== item.tempId)
            }
          }
        });
      } else {
        onPendingChangesChange({
          ...pendingChanges,
          shiftTemplateGroups: {
            ...pendingChanges.shiftTemplateGroups,
            items: {
              ...pendingChanges.shiftTemplateGroups.items,
              toDelete: [...pendingChanges.shiftTemplateGroups.items.toDelete, item.id]
            }
          }
        });
      }
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

  // --- Schedule Helpers ---

  const RECURRENCE_OPTIONS = [
    { value: 'once', label: 'Once (specific date range)', rrule: 'ONCE' },
    { value: 'weekly', label: 'Weekly', rrule: 'FREQ=WEEKLY' },
    { value: 'fortnightly', label: 'Fortnightly', rrule: 'FREQ=WEEKLY;INTERVAL=2' },
    { value: 'monthly', label: 'Monthly', rrule: 'FREQ=MONTHLY' },
  ];

  const getRecurrenceLabel = (rrule: string) => {
    const opt = RECURRENCE_OPTIONS.find(o => o.rrule === rrule);
    return opt?.label || rrule;
  };

  const handleSaveSchedule = async () => {
    if (!scheduleFormData.template_group_id || !scheduleFormData.start_date) {
      toast.error('Please select a template and start date.');
      return;
    }
    const rruleMap: Record<string, string> = {
      once: 'ONCE',
      weekly: 'FREQ=WEEKLY',
      fortnightly: 'FREQ=WEEKLY;INTERVAL=2',
      monthly: 'FREQ=MONTHLY',
    };
    try {
      await createSchedule.mutateAsync({
        template_group_id: scheduleFormData.template_group_id,
        house_id: houseId,
        rrule: rruleMap[scheduleFormData.recurrence] || 'ONCE',
        start_date: scheduleFormData.start_date,
        end_date: scheduleFormData.end_date || undefined,
        is_active: scheduleFormData.is_active,
      });
      toast.success('Deployment schedule saved.');
      setShowScheduleDialog(false);
      setScheduleFormData({ template_group_id: '', start_date: '', end_date: '', recurrence: 'once', is_active: true });
    } catch (err: any) {
      toast.error(`Failed to save schedule: ${err.message}`);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Remove this deployment schedule?')) return;
    try {
      await deleteSchedule.mutateAsync(id);
      toast.success('Schedule removed.');
    } catch (err: any) {
      toast.error(`Failed to remove: ${err.message}`);
    }
  };

  const handleApplySchedule = async (schedule: any) => {
    setIsApplyingSchedule(schedule.id);
    try {
      const result = await materializeTemplate({
        templateId: schedule.template_group_id,
        houseId: houseId,
        startDate: schedule.start_date,
        endDate: schedule.end_date || schedule.start_date,
      });
      toast.success(`Applied! Created ${result.created} shift${result.created !== 1 ? 's' : ''}.${result.skipped > 0 ? ` Skipped ${result.skipped} duplicates.` : ''}`);
    } catch (err: any) {
      toast.error(`Failed to apply: ${err.message}`);
    } finally {
      setIsApplyingSchedule(null);
    }
  };

  // --- Render Helpers ---

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
                      // First check if it's in our fetched defaults (which has the item data)
                      const defaultInfo = defaults?.find(d => d.checklist_id === clId);
                      // Fallback to houseChecklists if not found (though items might be missing depending on how houseChecklists is fetched)
                      const cl = defaultInfo?.checklist || houseChecklists.find(c => c.id === clId);
                      
                      const topItems = cl?.items?.slice(0, 2) || [];
                      const moreCount = (cl?.items?.length || 0) - 2;

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
                              </div>                        </div>
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

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Shift Templates</h3>
          <p className="text-sm text-muted-foreground">Group shifts together for bulk roster deployment.</p>
        </div>
        <Button onClick={() => { setGroupFormData({ name: '', description: '', selected_type_ids: [] }); setShowTemplateDialog(true); }} size="sm" className="gap-2 font-bold">
          <Plus className="size-4" /> Create Template
        </Button>
      </div>

      <div className="space-y-4">
        {visibleGroups.map(group => {
          const isPendingAdd = !!group.tempId;
          const isPendingUpdate = pendingChanges?.shiftTemplateGroups.toUpdate.some(u => u.id === group.id);

          return (
            <div key={group.id || group.tempId} className={cn(
              "bg-white border rounded-xl overflow-hidden shadow-sm",
              isPendingAdd && "border-dashed border-primary/40",
              isPendingUpdate && "border-primary/40"
            )}>
              <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings2 className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{group.name}</h4>
                      {(isPendingAdd || isPendingUpdate) && (
                        <Badge variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary border-primary/20">PENDING</Badge>
                      )}
                    </div>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenItemDialog(group)} className="h-8 text-xs font-bold gap-1.5 border-dashed">
                    <Plus className="size-3" /> Add Shift
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDeleteGroup(group)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(group.items || []).map((item: any) => {
                  const type = visibleShiftTypes.find(t => (t.id || t.tempId) === item.shift_type_id);
                  const theme = getPeriodTheme(type?.name || '', type?.color_theme, type?.icon_name);
                  const isItemPendingAdd = !!item.tempId;
                  
                  // Inheritance Logic: If item has no specific overrides, use the parent Type's defaults
                  const isItemPendingUpdate = pendingChanges?.shiftTemplateGroups.items.toUpdate.some(u => u.id === item.id);
                  const typeDefaults = getVisibleDefaults(item.shift_type_id);
                  const checklists = (item.checklist_ids && item.checklist_ids.length > 0) 
                    ? item.checklist_ids 
                    : (item.checklists?.map((c: any) => c.checklist_id) || typeDefaults);

                  return (
                    <div key={item.id || item.tempId} className={cn(
                      "bg-gray-50/50 border border-gray-100 rounded-lg p-3 group/item relative",
                      (isItemPendingAdd || isItemPendingUpdate) && "border-primary/20"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("size-7 rounded flex items-center justify-center", theme.bg)}>
                            <theme.icon className={cn("size-3.5", theme.text)} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{type?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">
                              {item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="size-6" onClick={() => handleOpenItemDialog(group, item)}>
                            <Edit className="size-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => handleDeleteItem(group, item)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-1">
                        {checklists.length > 0 ? (
                          checklists.map((clId: string) => {
                            const cl = houseChecklists.find(c => c.id === clId);
                            return (
                              <div key={clId} className="flex items-center gap-1.5 text-[10px] text-gray-600 bg-white border border-gray-100 rounded px-2 py-1">
                                <CheckSquare className="size-2.5 text-primary" />
                                <span className="truncate">{cl?.name || 'Unknown'}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[9px] text-muted-foreground italic px-1 flex items-center gap-1">
                            <Info className="size-2.5" /> Inherits defaults
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!group.items || group.items.length === 0) && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                    <p className="text-xs text-muted-foreground italic">No shifts added to this template yet.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSchedules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Deployment Schedules</h3>
          <p className="text-sm text-muted-foreground">Plan and apply shift templates to this house over a date range.</p>
        </div>
        <Button
          onClick={() => {
            setScheduleFormData({ template_group_id: '', start_date: '', end_date: '', recurrence: 'once', is_active: true });
            setShowScheduleDialog(true);
          }}
          size="sm"
          className="gap-2 font-bold"
        >
          <Plus className="size-4" /> Add Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
          <CalendarDays className="size-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No deployment schedules yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Create a schedule to plan when shift templates are applied to this house.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map(schedule => {
            const isApplying = isApplyingSchedule === schedule.id;
            return (
              <div key={schedule.id} className={cn(
                "bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between gap-4",
                !schedule.is_active && "opacity-60"
              )}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Repeat className="size-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900 truncate">{schedule.template_group?.name || 'Unknown Template'}</p>
                      {!schedule.is_active && (
                        <Badge variant="outline" className="text-[9px] h-4 text-gray-500 border-gray-200">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium mt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {schedule.start_date}{schedule.end_date && schedule.end_date !== schedule.start_date ? ` → ${schedule.end_date}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="size-3" />
                        {getRecurrenceLabel(schedule.rrule)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => handleApplySchedule(schedule)}
                    disabled={!!isApplyingSchedule}
                  >
                    {isApplying ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                    {isApplying ? 'Applying...' : 'Apply Now'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-12">
      {(mode === 'both' || mode === 'model') && renderModel()}
      {(mode === 'both' || mode === 'templates') && renderTemplates()}
      {(mode === 'both' || mode === 'templates') && renderSchedules()}

      <PopulateRosterModal 
        open={showPopulateModal}
        onOpenChange={setShowPopulateModal}
        houseId={houseId}
        houseName={allHouses.find(h => h.id === houseId)?.name || 'this house'}
      />

      {/* Shift Type Dialog */}
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
            {/* Primary Info Row */}
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

            {/* Timing Row */}
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

            {/* Visuals Row */}
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

            {/* Checklists Section */}
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
                              {topItems.map((item) => (
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

      {/* Template Group Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Create Shift Template</DialogTitle>
            <DialogDescription>A template is a named group of shifts (e.g. "Public Holiday").</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Template Name</Label>
                <Input value={groupFormData.name} onChange={e => setGroupFormData({...groupFormData, name: e.target.value})} placeholder="e.g. Christmas Day" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Description</Label>
                <Input value={groupFormData.description} onChange={e => setGroupFormData({...groupFormData, description: e.target.value})} placeholder="Standard weekend coverage..." className="h-10" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Included Shift Models</Label>
                {groupFormData.selected_type_ids?.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                    {groupFormData.selected_type_ids.length} Selected
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleShiftTypes.map(st => {
                  const theme = getPeriodTheme(st.name, st.color_theme, st.icon_name);
                  const isSelected = groupFormData.selected_type_ids?.includes(st.id || st.tempId);
                  const Icon = theme.icon;

                  return (
                    <div 
                      key={st.id || st.tempId} 
                      className={cn(
                        "cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary/50 relative group flex items-center gap-4",
                        isSelected ? "border-primary bg-primary/[0.02] shadow-sm" : "border-gray-100 bg-white"
                      )}
                      onClick={() => {
                        const id = st.id || st.tempId;
                        setGroupFormData(prev => ({
                          ...prev,
                          selected_type_ids: isSelected 
                            ? (prev.selected_type_ids || []).filter(i => i !== id)
                            : [...(prev.selected_type_ids || []), id]
                        }));
                      }}
                    >
                      <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", theme.bg)}>
                        <Icon className={cn("size-5", theme.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-gray-900 truncate">{st.name}</h5>
                        <p className="text-[10px] text-muted-foreground font-bold">
                          {st.default_start_time?.substring(0, 5)} - {st.default_end_time?.substring(0, 5)}
                        </p>
                      </div>
                      <div className={cn(
                        "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-primary border-primary text-white" : "border-gray-200 bg-white"
                      )}>
                        {isSelected && <CheckSquare className="size-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex gap-3">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-primary leading-relaxed">
                  <strong>Fast Setup:</strong> Select the shift models you want to include in this template. We'll automatically add them with their default times and checklists.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-gray-50/50">
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="font-bold">Cancel</Button>
            <Button 
              onClick={handleSaveGroup} 
              className="px-8 font-bold"
              disabled={!groupFormData.name?.trim()}
            >
              Create Template {groupFormData.selected_type_ids?.length > 0 && `(+${groupFormData.selected_type_ids.length} Shifts)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Item (Shift) Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{editingItem ? 'Edit Shift' : 'Add Shift to Template'}</DialogTitle>
            <DialogDescription>Define the timing and custom checklists for this shift in "{editingGroup?.name}".</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Shift Type</Label>
                <Select value={itemFormData.shift_type_id} onValueChange={val => {
                  const type = visibleShiftTypes.find(t => (t.id || t.tempId) === val);
                  setItemFormData({
                    ...itemFormData, 
                    shift_type_id: val,
                    start_time: type?.default_start_time?.substring(0, 5) || itemFormData.start_time,
                    end_time: type?.default_end_time?.substring(0, 5) || itemFormData.end_time
                  });
                }}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleShiftTypes.map(t => (
                      <SelectItem key={t.id || t.tempId} value={t.id || t.tempId}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Start Time</Label>
                  <Input type="time" value={itemFormData.start_time} onChange={e => setItemFormData({...itemFormData, start_time: e.target.value})} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">End Time</Label>
                  <Input type="time" value={itemFormData.end_time} onChange={e => setItemFormData({...itemFormData, end_time: e.target.value})} className="h-10" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Checklist Overrides</Label>
                {itemFormData.checklist_ids?.length === 0 ? (
                  <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-600 border-amber-200 gap-1.5">
                    <Info className="size-3" /> Inheriting Defaults
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                    {itemFormData.checklist_ids?.length || 0} Overrides Active
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {(sortedItemChecklists || []).map(cl => {
                  const isSelected = itemFormData.checklist_ids?.includes(cl.id);
                  const topItems = cl.items?.slice(0, 2) || [];

                  return (
                    <div
                      key={cl.id}
                      className={cn(
                        "cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary/50 relative group flex flex-col",
                        isSelected ? "border-primary bg-primary/[0.02] shadow-sm" : "border-gray-100 bg-white"
                      )}
                      onClick={() => {
                        const id = cl.id;
                        setItemFormData(prev => ({
                          ...prev,
                          checklist_ids: isSelected
                            ? (prev.checklist_ids || []).filter(i => i !== id)
                            : [...(prev.checklist_ids || []), id]
                        }));
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-gray-900 truncate pr-6">{cl.name}</h5>
                        </div>
                        <div className={cn(
                          "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-primary border-primary text-white" : "border-gray-200 bg-white"
                        )}>
                          {isSelected && <CheckSquare className="size-3" />}
                        </div>
                      </div>

                      <div className="space-y-1 flex-1">
                        {topItems.length > 0 ? (
                          <>
                            {topItems.map((item) => (
                              <div key={item.id} className="flex items-start gap-2">
                                <div className="size-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                <span className="text-[9px] text-gray-600 line-clamp-1 leading-tight">{item.title}</span>
                              </div>
                            ))}
                            {(cl.items?.length || 0) > 2 && (
                              <p className="text-[8px] text-primary/70 font-bold pl-2.5">
                                + {(cl.items?.length || 0) - 2} more...
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[9px] text-muted-foreground italic pl-1">No tasks defined</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>              
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex gap-3">
                <Info className="size-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  <strong>Note:</strong> If no checklists are selected here, this template shift will automatically use the "Default Checklists" defined in the main Shift Model.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Linked Participants</Label>
                {itemFormData.participant_ids?.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                    {itemFormData.participant_ids?.length || 0} Linked
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {(houseParticipants || []).filter((p: any) => p.status === 'active').map((p: any) => {
                  const isSelected = itemFormData.participant_ids?.includes(p.id);
                  
                  return (
                    <div 
                      key={p.id} 
                      className={cn(
                        "cursor-pointer border-2 rounded-xl p-3 transition-all hover:border-primary/50 relative group flex items-center gap-3",
                        isSelected ? "border-primary bg-primary/[0.02] shadow-sm" : "border-gray-100 bg-white"
                      )}
                      onClick={() => {
                        const id = p.id;
                        setItemFormData(prev => ({
                          ...prev,
                          participant_ids: isSelected 
                            ? (prev.participant_ids || []).filter(i => i !== id)
                            : [...(prev.participant_ids || []), id]
                        }));
                      }}
                    >
                      <div className={cn(
                        "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-primary border-primary text-white" : "border-gray-200 bg-white"
                      )}>
                        {isSelected && <CheckSquare className="size-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-gray-900 truncate">{p.first_name} {p.last_name}</h5>
                      </div>
                    </div>
                  );
                })}
                {(houseParticipants || []).filter((p: any) => p.status === 'active').length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic col-span-2">No active participants found.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-gray-50/50">
            <Button variant="outline" onClick={() => setShowItemDialog(false)} className="font-bold">Cancel</Button>
            <Button onClick={handleSaveItem} className="px-8 font-bold">
              {editingItem ? 'Update Shift' : 'Add to Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deployment Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Deployment Schedule</DialogTitle>
            <DialogDescription>Plan when to apply a shift template to this house. Click "Apply Now" on the schedule when you're ready to create the shifts.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Shift Template</Label>
              <Select value={scheduleFormData.template_group_id} onValueChange={v => setScheduleFormData(prev => ({ ...prev, template_group_id: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {(visibleGroups || []).map(g => (
                    <SelectItem key={g.id || (g as any).tempId} value={g.id || (g as any).tempId}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Start Date</Label>
                <Input
                  type="date"
                  value={scheduleFormData.start_date}
                  onChange={e => setScheduleFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">End Date</Label>
                <Input
                  type="date"
                  value={scheduleFormData.end_date}
                  onChange={e => setScheduleFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  min={scheduleFormData.start_date}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recurrence</Label>
              <Select value={scheduleFormData.recurrence} onValueChange={v => setScheduleFormData(prev => ({ ...prev, recurrence: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Repeat className="size-3.5 text-muted-foreground" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="schedule-active"
                checked={scheduleFormData.is_active}
                onCheckedChange={v => setScheduleFormData(prev => ({ ...prev, is_active: v }))}
              />
              <Label htmlFor="schedule-active" className="text-sm cursor-pointer">Active</Label>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-3">
              <Info className="size-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-indigo-800 leading-relaxed">
                Saving a schedule does not immediately create shifts. Use <strong>Apply Now</strong> on the schedule card to generate shifts for the specified date range.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)} className="font-bold">Cancel</Button>
            <Button
              onClick={handleSaveSchedule}
              className="font-bold"
              disabled={!scheduleFormData.template_group_id || !scheduleFormData.start_date || createSchedule.isPending}
            >
              {createSchedule.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Model Dialog */}
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

      <PopulateRosterModal 
        open={showPopulateModal}
        onOpenChange={setShowPopulateModal}
        houseId={houseId}
        houseName={allHouses.find(h => h.id === houseId)?.name || 'this house'}
      />
    </div>
  );
}
