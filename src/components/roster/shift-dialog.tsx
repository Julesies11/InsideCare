import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStaff } from '@/hooks/use-staff';
import { useHouses } from '@/hooks/use-houses';
import { useParticipants } from '@/hooks/use-participants';
import { useHouseShiftTypes } from '@/hooks/use-house-shift-types';
import { useHouseStaffAssignments } from '@/hooks/use-house-staff-assignments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Home, User, Trash2, Copy, CheckSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { ShiftChecklistPicker } from './ShiftChecklistPicker';

export interface AssignedChecklist {
  checklist_id: string;
  assignment_title: string;
}

export interface ShiftFormData {
  staff_id: string | null;
  start_date: string;
  start_time: string;
  end_time: string;
  end_date?: string;
  house_id: string | null;
  shift_type: string;
  shift_type_id?: string | null;
  notes: string;
  participant_ids: string[];
  assigned_checklists: AssignedChecklist[];
}

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: any;
  onSave: (data: ShiftFormData, isDuplicate?: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  preSelectedDate?: string;
  preSelectedHouseId?: string;
  preSelectedShiftTypeId?: string;
  staffId?: string | null;
  readOnly?: boolean;
  staffSelectionDisabled?: boolean;
  staffList?: any[];
  houses?: any[];
  participants?: any[];
  checklists?: any[];
  scrollToNotes?: boolean;
}

export function ShiftDialog({ 
  open, 
  onOpenChange, 
  shift, 
  onSave, 
  onDelete, 
  preSelectedDate,
  preSelectedHouseId,
  preSelectedShiftTypeId,
  staffId,
  readOnly = false,
  staffSelectionDisabled = false,
  staffList: passedStaffList,
  houses: passedHouses,
  participants: passedParticipants,
  checklists: passedChecklists,
  scrollToNotes = false
}: ShiftDialogProps) {
  const isEdit = !!shift;
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Use passed props if available, otherwise fallback to local hooks (though props are preferred for Roster Board)
  const { staff: localStaff } = useStaff(0, 1000, [], { statuses: ['active'] });
  const { houses: localHouses } = useHouses(0, 100, [], { statuses: ['active'] });
  const { participants: localParticipants } = useParticipants(0, 1000);
  
  const staffList = passedStaffList || localStaff || [];
  const houses = passedHouses || localHouses || [];
  const participants = passedParticipants || localParticipants || [];
  const allChecklists = passedChecklists || [];

  const [formData, setFormData] = useState<ShiftFormData>({
    staff_id: null,
    start_date: '',
    start_time: '09:00',
    end_time: '17:00',
    end_date: '',
    house_id: null,
    shift_type: 'SIL',
    shift_type_id: null,
    notes: '',
    participant_ids: [],
    assigned_checklists: [],
  });

  const { assignments: houseStaffAssignments } = useHouseStaffAssignments(formData.house_id || undefined);

  // Filter staff list by house if house_id is present
  const filteredStaffList = useMemo(() => {
    if (!formData.house_id || formData.house_id === 'none') {
      return staffList.filter(s => s.status === 'active');
    }
    
    if (houseStaffAssignments && houseStaffAssignments.length > 0) {
      return houseStaffAssignments
        .filter(a => {
          // Must be active staff and NOT have an end date (or end date is in the future)
          const isStaffActive = a.staff?.status === 'active';
          const hasNoEndDate = !a.end_date || new Date(a.end_date) > new Date();
          return isStaffActive && hasNoEndDate;
        })
        .map(a => a.staff)
        .filter(Boolean);
    }
    
    // Fallback to all active staff if no assignments found for this house
    return staffList.filter(s => s.status === 'active');
  }, [formData.house_id, staffList, houseStaffAssignments]);

  const { shiftTypes } = useHouseShiftTypes(formData.house_id || undefined);
  const { houseChecklists } = useHouseChecklists(formData.house_id || undefined);
  const currentChecklists = passedChecklists || houseChecklists || [];

  useEffect(() => {
    if (open) {
      if (shift) {
        setFormData({
          staff_id: shift.staff_id,
          start_date: shift.start_date,
          end_date: shift.end_date || shift.start_date,
          start_time: shift.start_time.substring(0, 5),
          end_time: shift.end_time.substring(0, 5),
          house_id: shift.house_id,
          shift_type: shift.shift_type,
          shift_type_id: shift.shift_type_id || null,
          notes: shift.notes || '',
          participant_ids: shift.participants?.map((p: any) => p.id) || [],
          assigned_checklists: shift.assigned_checklists || [],
        });
        setIsDuplicating(false);
      } else {
        const initialDate = preSelectedDate || new Date().toISOString().split('T')[0];
        const initialHouseId = preSelectedHouseId || null;
        
        const baseData: ShiftFormData = {
          staff_id: staffId || null,
          start_date: initialDate,
          end_date: initialDate,
          start_time: '09:00',
          end_time: '17:00',
          house_id: initialHouseId,
          shift_type: 'SIL',
          shift_type_id: null,
          notes: '',
          participant_ids: initialHouseId ? participants.filter(p => p.house_id === initialHouseId && p.status === 'active').map(p => p.id) : [],
          assigned_checklists: [],
        };

        if (preSelectedShiftTypeId) {
          const type = shiftTypes.find(t => t.id === preSelectedShiftTypeId);
          if (type) {
            baseData.shift_type = type.name;
            baseData.shift_type_id = type.id;
            baseData.start_time = type.default_start_time?.substring(0, 5) || '09:00';
            baseData.end_time = type.default_end_time?.substring(0, 5) || '17:00';
          }
        }
        setFormData(baseData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shift, preSelectedDate, preSelectedHouseId, preSelectedShiftTypeId, staffId]);

  const handleSave = async () => {
    if (!formData.start_date || !formData.start_time || !formData.end_time) {
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

  const toggleChecklist = (id: string, name: string) => {
    setFormData(prev => {
      const isAssigned = prev.assigned_checklists.some(ac => ac.checklist_id === id);
      return {
        ...prev,
        assigned_checklists: isAssigned
          ? prev.assigned_checklists.filter(ac => ac.checklist_id !== id)
          : [...prev.assigned_checklists, { checklist_id: id, assignment_title: name }]
      };
    });
  };

  const handleShiftTypeChange = async (val: string) => {
    const dynamicType = shiftTypes?.find(st => st.id === val || st.name === val);
    const updatedData = {
      ...formData,
      shift_type_id: dynamicType?.id || null,
      shift_type: dynamicType?.name || val
    };

    if (dynamicType?.default_start_time) {
      updatedData.start_time = dynamicType.default_start_time.substring(0, 5);
    }
    if (dynamicType?.default_end_time) {
      updatedData.end_time = dynamicType.default_end_time.substring(0, 5);
    }

    setFormData(updatedData);
  };

  const handleDuplicate = () => {
    setIsDuplicating(true);
    // Use a small timeout or just call handleSave directly if handleSave uses the state
    // But since handleSave is defined here, we can just pass the flag if needed or trust state update if it's simple enough
    // Actually, handleSave uses isDuplicating state.
    setTimeout(() => handleSave(), 0);
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
      <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl border-primary/10 sm:rounded-2xl">
        <DialogHeader className="p-4 sm:p-5 pb-2 sm:pb-3 bg-gray-50/50 border-b">
          <div className="flex items-center gap-3">
            <div className="size-9 sm:size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight truncate">
                {isEdit ? 'Update Shift' : 'Create New Shift'}
              </DialogTitle>
              <DialogDescription className="text-xs truncate">
                {isEdit ? `Editing shift for ${formData.start_date}` : 'Define the schedule and assignments'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6 custom-scrollbar bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
                <User className="size-3" /> Assign Staff
              </Label>
              <Select 
                value={formData.staff_id || 'none'} 
                onValueChange={val => setFormData({...formData, staff_id: val === 'none' ? null : val})}
                disabled={readOnly || staffSelectionDisabled}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm font-medium">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none" className="font-bold text-amber-600 italic">Open Shift (Unassigned)</SelectItem>
                  {filteredStaffList.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5 sm:size-6">
                          <AvatarImage src={s.photo_url || undefined} />
                          <AvatarFallback className="text-[10px]">{s.name?.substring(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{s.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
                <Home className="size-3" /> Service Location
              </Label>
              <Select 
                value={formData.house_id || 'none'} 
                onValueChange={handleHouseChange}
                disabled={readOnly}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm font-medium">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-4 sm:pt-5 border-t border-gray-100">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shift Start</Label>
              <div className="flex gap-2">
                <Input 
                  type="date" 
                  value={formData.start_date} 
                  onChange={e => {
                    const newDate = e.target.value;
                    setFormData(prev => ({
                      ...prev, 
                      start_date: newDate, 
                      end_date: (prev.end_date === prev.start_date || !prev.end_date) ? newDate : prev.end_date
                    }));
                  }} 
                  className="h-10 sm:h-11 font-bold text-sm" 
                  disabled={readOnly} 
                />
                <Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="h-10 sm:h-11 w-28 sm:w-32 font-black text-sm" disabled={readOnly} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shift End</Label>
              <div className="flex gap-2">
                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="h-10 sm:h-11 font-bold text-sm" disabled={readOnly} />
                <Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="h-10 sm:h-11 w-28 sm:w-32 font-black text-sm" disabled={readOnly} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-4 sm:pt-5 border-t border-gray-100">
            <div className="space-y-1.5">
              <Label htmlFor="shift_type" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Shift Type *</Label>
              <Select value={formData.shift_type_id || formData.shift_type} onValueChange={handleShiftTypeChange} disabled={readOnly}>
                <SelectTrigger className="h-10 sm:h-11 text-sm font-medium">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes.length > 0 ? (
                    shiftTypes.map(st => (
                      <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="SIL">SIL</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-5 border-t border-gray-100">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Participants Present</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {participants
                .filter(p => (!formData.house_id || p.house_id === formData.house_id) && p.status === 'active')
                .map(p => (
                  <div 
                    key={p.id} 
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border transition-all cursor-pointer",
                      formData.participant_ids.includes(p.id) ? "bg-primary/5 border-primary shadow-sm" : "bg-gray-50 border-gray-100 opacity-60 grayscale-[50%]"
                    )}
                    onClick={() => !readOnly && toggleParticipant(p.id)}
                  >
                    <Checkbox checked={formData.participant_ids.includes(p.id)} onCheckedChange={() => !readOnly && toggleParticipant(p.id)} className="size-3.5 sm:size-4" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold truncate">{p.name}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-5 border-t border-gray-100">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Assigned Routine Checklists</Label>
            <ShiftChecklistPicker 
              checklists={currentChecklists}
              selectedIds={formData.assigned_checklists.map(ac => ac.checklist_id)}
              onToggle={toggleChecklist}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-1.5 pt-4 sm:pt-5 border-t border-gray-100" id="shift-notes-section">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Internal Handover Notes</Label>
            <Textarea 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              placeholder="Enter instructions for staff working this shift..."
              className="min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm"
              disabled={readOnly}
            />
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 bg-gray-50/80 border-t flex flex-row justify-between items-center gap-2">
          <div className="flex gap-2">
            {isEdit && !readOnly && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-9 sm:size-10 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </Button>
            )}
            {isEdit && !readOnly && (
              <Button 
                variant="outline" 
                size="icon" 
                className="size-9 sm:size-10 shrink-0"
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                {isDuplicating ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
              </Button>
            )}
          </div>
          <div className="flex gap-2 grow sm:grow-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="grow sm:grow-0 text-xs sm:text-sm h-9 sm:h-10">Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || readOnly} 
              className="grow sm:grow-0 text-xs sm:text-sm h-9 sm:h-10 font-bold"
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckSquare className="size-4 mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Shift'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
