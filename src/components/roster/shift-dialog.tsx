import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  Zap, 
  Calendar, 
  User, 
  Users, 
  Home, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  Loader2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn, getPeriodTheme } from '@/lib/utils';
import { useOrgShiftTemplates } from '@/hooks/use-org-shift-templates';

export interface AssignedChecklist {
  id?: string;
  checklist_id: string;
  assignment_title: string;
  status?: string;
}

export interface ShiftFormData {
  staff_id: string | null;
  shift_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  house_id: string | null;
  shift_type: string;
  shift_type_id?: string | null;
  org_shift_template_id?: string | null;
  status: string;
  notes: string;
  participant_ids: string[];
  assigned_checklists: AssignedChecklist[];
}

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: {
    id: string;
    staff_id: string;
    shift_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    house_id: string | null;
    shift_type: string;
    org_shift_template_id?: string | null;
    status: string;
    notes: string | null;
    participant_ids?: string[];
    assigned_checklists?: AssignedChecklist[];
  } | null;
  staffId?: string;
  preSelectedDate?: Date;
  preSelectedHouseId?: string;
  preSelectedShiftTypeId?: string;
  staffList: Array<{ id: string; name: string; photo_url?: string | null; status?: string }>;
  staffSelectionDisabled?: boolean;
  houses: Array<{ id: string; name: string }>;
  participants: Array<{ id: string; name: string; status?: string; house_id?: string | null }>;
  checklists: any[];
  shiftTypes: any[];
  onSave: (formData: ShiftFormData, isDuplicating?: boolean) => Promise<any>;
  onDelete?: (shiftId: string) => Promise<void>;
  scrollToNotes?: boolean;
  readOnly?: boolean;
}

export function ShiftDialog({
  open,
  onOpenChange,
  shift,
  staffId,
  preSelectedDate,
  preSelectedHouseId,
  preSelectedShiftTypeId,
  staffList,
  staffSelectionDisabled = false,
  houses = [],
  participants = [],
  checklists = [],
  shiftTypes = [],
  onSave,
  onDelete,
  readOnly = false,
}: ShiftDialogProps) {
  const { templates: orgTemplates } = useOrgShiftTemplates();
  const isEdit = !!shift;
  const [formData, setFormData] = useState<ShiftFormData>({
    staff_id: null,
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    house_id: null,
    shift_type: 'SIL',
    org_shift_template_id: null,
    status: 'Scheduled',
    notes: '',
    participant_ids: [],
    assigned_checklists: [],
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  // Sync logic
  useEffect(() => {
    if (open) {
      if (shift) {
        setFormData({
          staff_id: shift.staff_id,
          shift_date: shift.shift_date,
          end_date: shift.end_date || shift.shift_date,
          start_time: shift.start_time.substring(0, 5),
          end_time: shift.end_time.substring(0, 5),
          house_id: shift.house_id,
          shift_type: shift.shift_type,
          org_shift_template_id: shift.org_shift_template_id || null,
          status: shift.status,
          notes: shift.notes || '',
          participant_ids: shift.participant_ids || [],
          assigned_checklists: shift.assigned_checklists || [],
        });
      } else {
        const initialDate = preSelectedDate ? format(preSelectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const initialHouseId = preSelectedHouseId || null;
        
        const baseData: ShiftFormData = {
          staff_id: staffId || null,
          shift_date: initialDate,
          end_date: initialDate,
          start_time: '09:00',
          end_time: '17:00',
          house_id: initialHouseId,
          shift_type: 'SIL',
          org_shift_template_id: null,
          status: 'Scheduled',
          notes: '',
          participant_ids: initialHouseId ? participants.filter(p => p.house_id === initialHouseId && p.status === 'active').map(p => p.id) : [],
          assigned_checklists: [],
        };

        if (preSelectedShiftTypeId) {
          const orgTemplate = orgTemplates.find(t => t.id === preSelectedShiftTypeId);
          if (orgTemplate) {
            baseData.shift_type = orgTemplate.name;
            baseData.org_shift_template_id = orgTemplate.id;
            if (orgTemplate.start_time_default) baseData.start_time = orgTemplate.start_time_default.substring(0, 5);
            if (orgTemplate.end_time_default) baseData.end_time = orgTemplate.end_time_default.substring(0, 5);
          } else {
            const type = shiftTypes.find(t => t.id === preSelectedShiftTypeId);
            if (type) {
              baseData.shift_type = type.name;
              baseData.shift_type_id = type.id;
              baseData.start_time = type.default_start_time?.substring(0, 5) || '09:00';
              baseData.end_time = type.default_end_time?.substring(0, 5) || '17:00';
            }
          }
        }
        setFormData(baseData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shift, preSelectedDate, preSelectedHouseId, preSelectedShiftTypeId, staffId]);

  const handleSave = async () => {
    if (!formData.shift_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in required date and time fields');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData, isDuplicating);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleHouseChange = (val: string) => {
    const houseId = val === 'none' ? null : val;
    const houseParticipants = houseId ? participants.filter(p => p.house_id === houseId && p.status === 'active').map(p => p.id) : [];
    setFormData({ ...formData, house_id: houseId, participant_ids: houseParticipants });
  };

  const toggleParticipant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(id) 
        ? prev.participant_ids.filter(p => p !== id) 
        : [...prev.participant_ids, id]
    }));
  };

  const handleShiftTypeChange = async (val: string) => {
    const orgTemplate = orgTemplates.find(t => t.id === val);
    if (orgTemplate) {
      let checklistsToAssign: AssignedChecklist[] = [];
      
      if (orgTemplate.default_checklists && orgTemplate.default_checklists.length > 0 && formData.house_id) {
        const { data: masterCls } = await supabase
          .from('checklist_master')
          .select('id, name')
          .in('id', orgTemplate.default_checklists);
        
        if (masterCls && masterCls.length > 0) {
          const names = masterCls.map(m => m.name);
          const { data: houseCls } = await supabase
            .from('house_checklists')
            .select('id, name')
            .eq('house_id', formData.house_id)
            .in('name', names);
          
          if (houseCls) {
            checklistsToAssign = houseCls.map(hc => ({
              checklist_id: hc.id,
              assignment_title: hc.name
            }));
          }
        }
      }

      setFormData(prev => ({
        ...prev,
        org_shift_template_id: orgTemplate.id,
        shift_type: orgTemplate.name,
        shift_type_id: null,
        start_time: orgTemplate.start_time_default ? orgTemplate.start_time_default.substring(0, 5) : prev.start_time,
        end_time: orgTemplate.end_time_default ? orgTemplate.end_time_default.substring(0, 5) : prev.end_time,
        assigned_checklists: checklistsToAssign.length > 0 ? checklistsToAssign : prev.assigned_checklists
      }));
      return;
    }

    const dynamicType = shiftTypes?.find(st => st.id === val || st.name === val);
    const updatedData = {
      ...formData,
      shift_type_id: dynamicType?.id || null,
      shift_type: dynamicType?.name || val,
      org_shift_template_id: null
    };

    if (dynamicType?.default_start_time) {
      updatedData.start_time = dynamicType.default_start_time.substring(0, 5);
    }
    if (dynamicType?.default_end_time) {
      updatedData.end_time = dynamicType.default_end_time.substring(0, 5);
    }

    setFormData(updatedData);
  };

  const handleDelete = async () => {
    if (!onDelete || !shift) return;
    if (!confirm('Are you sure you want to delete this shift?')) return;
    setDeleting(true);
    try {
      await onDelete(shift.id);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl border-primary/10">
        <DialogHeader className="p-6 pb-2 bg-gray-50/50 border-b">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {isEdit ? 'Update Shift' : 'Create New Shift'}
              </DialogTitle>
              <DialogDescription>
                {isEdit ? `Editing shift for ${formData.shift_date}` : 'Define the schedule and assignments'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar bg-white">
          {!isEdit && (orgTemplates?.length > 0 || (shiftTypes?.length || 0) > 0) && formData.house_id && (
            <div className="space-y-3 p-4 bg-primary/[0.03] border border-primary/10 rounded-xl">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Zap className="size-3 fill-primary" /> Quick Fill Org Shift Templates
              </Label>
              <div className="flex flex-wrap gap-2">
                {orgTemplates.map(template => {
                  const theme = getPeriodTheme(template.name, template.color_theme, template.icon_name);
                  const Icon = theme.icon;
                  const isActive = formData.org_shift_template_id === template.id;

                  return (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleShiftTypeChange(template.id)}
                      className={cn(
                        "h-10 px-4 rounded-xl font-bold uppercase tracking-tight text-[10px] border-2 transition-all flex items-center gap-2",
                        isActive 
                          ? `bg-${theme.color}-50 border-${theme.color}-500 text-${theme.color}-700 shadow-md ring-2 ring-${theme.color}-500/20`
                          : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <Icon className={cn("size-3.5", isActive ? `text-${theme.color}-600` : "text-gray-300")} />
                      {template.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
                <User className="size-3" /> Assign Staff
              </Label>
              <Select 
                value={formData.staff_id || 'none'} 
                onValueChange={val => setFormData({...formData, staff_id: val === 'none' ? null : val})}
                disabled={readOnly || staffSelectionDisabled}
              >
                <SelectTrigger className="h-12 text-base font-medium">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-bold text-amber-600 italic">Open Shift (Unassigned)</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={s.photo_url || undefined} />
                          <AvatarFallback>{s.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{s.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
                <Home className="size-3" /> Service Location
              </Label>
              <Select 
                value={formData.house_id || 'none'} 
                onValueChange={handleHouseChange}
                disabled={readOnly}
              >
                <SelectTrigger className="h-12 text-base font-medium">
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone / No House</SelectItem>
                  {houses.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shift Start</Label>
              <div className="flex gap-2">
                <Input type="date" value={formData.shift_date} onChange={e => setFormData({...formData, shift_date: e.target.value, end_date: e.target.value})} className="h-11 font-bold" disabled={readOnly} />
                <Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="h-11 w-32 font-black" disabled={readOnly} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shift End</Label>
              <div className="flex gap-2">
                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="h-11 font-bold" disabled={readOnly} />
                <Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="h-11 w-32 font-black" disabled={readOnly} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div className="space-y-2">
              <Label htmlFor="shift_type" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shift Type *</Label>
              <Select value={formData.org_shift_template_id || formData.shift_type_id || formData.shift_type} onValueChange={handleShiftTypeChange} disabled={readOnly}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {orgTemplates.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary/50">Organization Templates</div>
                      {orgTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                      <div className="h-px bg-gray-100 my-1" />
                    </>
                  )}
                  {shiftTypes.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">House Specific</div>
                      {shiftTypes.map(st => (
                        <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData({...formData, status: v})}
                disabled={readOnly}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="No Show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-xl bg-gray-50/30 overflow-hidden">
            <button 
              type="button"
              onClick={() => setShowParticipants(!showParticipants)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-tight">Assigned Participants</span>
                <Badge variant="secondary" className="text-[10px] h-5">{formData.participant_ids.length} Selected</Badge>
              </div>
              {showParticipants ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />}
            </button>
            {showParticipants && (
              <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {participants.filter(p => !formData.house_id || p.house_id === formData.house_id).map(p => (
                  <div 
                    key={p.id} 
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer",
                      formData.participant_ids.includes(p.id) ? "bg-primary/5 border-primary/30" : "bg-white border-gray-100 hover:border-gray-300"
                    )}
                    onClick={() => !readOnly && toggleParticipant(p.id)}
                  >
                    <Checkbox checked={formData.participant_ids.includes(p.id)} disabled={readOnly} />
                    <span className="text-xs font-medium truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-tight">Shift Requirements (Checklists)</span>
              </div>
              {!readOnly && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px] font-bold border-dashed border-primary/30 text-primary"
                  onClick={() => setFormData({...formData, assigned_checklists: [...formData.assigned_checklists, { checklist_id: '', assignment_title: 'New Task' }]})}
                >
                  <Plus className="size-3 mr-1" /> Add Requirement
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {formData.assigned_checklists.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                  <p className="text-xs text-muted-foreground italic">No requirements assigned to this shift.</p>
                </div>
              ) : (
                formData.assigned_checklists.map((ac, idx) => (
                  <div key={idx} className="flex items-end gap-3 p-3 bg-white border rounded-xl shadow-sm group">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[9px] font-bold text-gray-400 uppercase">Title</Label>
                      <Input 
                        value={ac.assignment_title} 
                        onChange={e => {
                          const updated = [...formData.assigned_checklists];
                          updated[idx].assignment_title = e.target.value;
                          setFormData({...formData, assigned_checklists: updated});
                        }}
                        className="h-9 text-xs font-bold" 
                        disabled={readOnly}
                      />
                    </div>
                    <div className="flex-[1.5] space-y-1.5">
                      <Label className="text-[9px] font-bold text-gray-400 uppercase">Checklist Template</Label>
                      <Select 
                        value={ac.checklist_id || 'none'} 
                        onValueChange={v => {
                          const updated = [...formData.assigned_checklists];
                          updated[idx].checklist_id = v === 'none' ? '' : v;
                          setFormData({...formData, assigned_checklists: updated});
                        }}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No template</SelectItem>
                          {checklists.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!readOnly && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-9 text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const updated = [...formData.assigned_checklists];
                          updated.splice(idx, 1);
                          setFormData({...formData, assigned_checklists: updated});
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEdit && !readOnly && (
              <Button variant="ghost" size="sm" className="text-destructive font-bold gap-2" onClick={handleDelete} disabled={saving || deleting}>
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold">Cancel</Button>
            {!readOnly && (
              <Button onClick={handleSave} disabled={saving} className="px-8 font-black uppercase tracking-wide">
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : isEdit ? 'Update Shift' : 'Create Shift'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
