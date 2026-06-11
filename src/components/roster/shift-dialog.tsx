import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { format } from 'date-fns';
import {
  Calendar,
  CheckSquare,
  Clock,
  Home,
  Loader2,
  MapPin,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { cn, SHIFT_ICONS } from '@/lib/utils';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useHouseShiftTemplates } from '@/hooks/use-house-shift-templates';
import { useHouseStaffAssignments } from '@/hooks/use-house-staff-assignments';
import { useActiveHouses } from '@/hooks/use-houses';
import { useActiveParticipants } from '@/hooks/use-participants';
import { useActiveStaff } from '@/hooks/use-staff';
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
import { SecureAvatar } from '@/components/ui/secure-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  shift_template: string;
  shift_template_id?: string | null;
  notes: string;
  participant_ids: string[];
  assigned_checklists: AssignedChecklist[];
  // Event fields
  title?: string;
  location?: string;
  entry_type?: 'shift' | 'event';
}

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: any;
  onSave: (data: ShiftFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  preSelectedDate?: string | Date;
  preSelectedHouseId?: string;
  preSelectedShiftTemplateId?: string;
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
  preSelectedShiftTemplateId,
  staffId,
  readOnly = false,
  staffSelectionDisabled = false,
  staffList: passedStaffList,
  houses: passedHouses,
  participants: passedParticipants,
  checklists: passedChecklists,
  scrollToNotes = false,
}: ShiftDialogProps) {
  const { user, isAdmin } = useAuth();
  const isEdit = !!shift;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Disable staff selection ONLY if explicitly requested AND user is NOT an admin
  const isStaffSelectionDisabled = staffSelectionDisabled && !isAdmin;

  // Only fire fallback queries when the dialog is open AND the caller hasn't provided the lists.
  // On the Roster Board, all three lists are passed as props, so these queries stay disabled.
  const needsLocalStaff = open && !passedStaffList;
  const needsLocalHouses = open && !passedHouses;
  const needsLocalParticipants = open && !passedParticipants;

  const { staff: localStaff } = useActiveStaff({ enabled: needsLocalStaff });
  const { data: localHousesData } = useActiveHouses({
    enabled: needsLocalHouses,
  });
  const localHouses = localHousesData || [];
  const { participants: localParticipants } = useActiveParticipants({
    enabled: needsLocalParticipants,
  });

  const staffList = passedStaffList || localStaff || [];
  const houses = passedHouses || localHouses || [];
  const participants = passedParticipants || localParticipants || [];

  const [formData, setFormData] = useState<ShiftFormData>({
    staff_id: null,
    start_date: '',
    start_time: '09:00',
    end_time: '17:00',
    end_date: '',
    house_id: null,
    shift_template: 'SIL',
    shift_template_id: null,
    notes: '',
    participant_ids: [],
    assigned_checklists: [],
  });

  // Only fetch house checklists when dialog is open and no checklists were passed
  const needsLocalChecklists =
    open && (!passedChecklists || passedChecklists.length === 0);
  const { houseChecklists } = useHouseChecklists(
    needsLocalChecklists ? formData.house_id || undefined : undefined,
  );
  const currentChecklists =
    passedChecklists && passedChecklists.length > 0
      ? passedChecklists
      : houseChecklists;

  // Only fetch house staff assignments when dialog is open and a house is selected
  const { assignments: houseStaffAssignments } = useHouseStaffAssignments(
    formData.house_id || undefined,
    { enabled: open && !!formData.house_id },
  );

  // Filter staff list by house if house_id is present
  const filteredStaffList = useMemo(() => {
    let list = [];
    const today = new Date().toISOString().split('T')[0];

    if (!formData.house_id || formData.house_id === 'none') {
      list = staffList.filter((s) => s.status === 'active');
    } else if (houseStaffAssignments && houseStaffAssignments.length > 0) {
      list = houseStaffAssignments
        .filter((a) => {
          // Must be active staff and NOT have an end date (or end date is in the future)
          const isStaffActive = a.staff?.status === 'active';
          const isAssignmentActive = !a.end_date || a.end_date >= today;
          return isStaffActive && isAssignmentActive;
        })
        .map((a) => a.staff)
        .filter(Boolean);
    } else {
      // Fallback to all active staff if no assignments found for this house
      list = staffList.filter((s) => s.status === 'active');
    }

    // CRITICAL: Ensure the currently assigned staff member is ALWAYS in the list
    if (formData.staff_id) {
      const currentStaff = staffList.find((s) => s.id === formData.staff_id);
      if (currentStaff && !list.some((s) => s.id === formData.staff_id)) {
        list.unshift(currentStaff);
      }
    }

    return list;
  }, [formData.house_id, formData.staff_id, staffList, houseStaffAssignments]);

  const { shiftTemplates } = useHouseShiftTemplates(
    open && formData.house_id ? formData.house_id : undefined,
  );

  const currentHouse = useMemo(() => {
    return houses.find(
      (h) => h.id === (formData.house_id || preSelectedHouseId),
    );
  }, [houses, formData.house_id, preSelectedHouseId]);

  useEffect(() => {
    if (open) {
      if (shift) {
        setFormData({
          staff_id: shift.staff_id,
          start_date: shift.start_date,
          end_date: shift.end_date || shift.start_date,
          start_time: (shift.start_time || '09:00').substring(0, 5),
          end_time: (shift.end_time || '17:00').substring(0, 5),
          house_id: shift.house_id,
          shift_template: shift.shift_template,
          shift_template_id: shift.shift_template_id || null,
          notes: shift.notes || '',
          participant_ids:
            shift.participant_ids ||
            shift.participants?.map((p: any) => p.participant?.id || p.id) ||
            [],
          assigned_checklists: shift.assigned_checklists || [],
          title: shift.title || '',
          location: shift.location || '',
          entry_type: shift.entry_type || 'shift',
        });
      } else {
        let initialDate = '';
        if (preSelectedDate) {
          if (preSelectedDate instanceof Date) {
            initialDate = format(preSelectedDate, 'yyyy-MM-dd');
          } else {
            const dateStr = String(preSelectedDate);
            const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
            if (match) {
              initialDate = match[1];
            } else {
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                initialDate = format(parsed, 'yyyy-MM-dd');
              } else {
                initialDate = dateStr;
              }
            }
          }
        } else {
          initialDate = format(new Date(), 'yyyy-MM-dd');
        }
        const initialHouseId = preSelectedHouseId || null;

        // Auto-select all active participants for the house
        const houseParticipants = initialHouseId
          ? participants
              .filter(
                (p) => p.house_id === initialHouseId && p.status === 'active',
              )
              .map((p) => p.id)
          : [];

        const baseData: ShiftFormData = {
          staff_id: staffId || null,
          start_date: initialDate,
          end_date: initialDate,
          start_time: '09:00',
          end_time: '17:00',
          house_id: initialHouseId,
          shift_template: 'SIL',
          shift_template_id: null,
          notes: '',
          participant_ids: houseParticipants,
          assigned_checklists: [],
        };

        if (preSelectedShiftTemplateId) {
          const type = shiftTemplates.find(
            (t) => t.id === preSelectedShiftTemplateId,
          );
          if (type) {
            baseData.shift_template = type.shift_template_name;
            baseData.shift_template_id = type.id;
            baseData.start_time =
              type.default_start_time?.substring(0, 5) || '09:00';
            baseData.end_time =
              type.default_end_time?.substring(0, 5) || '17:00';
          }
        }
        setFormData(baseData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    shift,
    preSelectedDate,
    preSelectedHouseId,
    preSelectedShiftTemplateId,
    staffId,
  ]);

  // Auto-populate participants when they finish loading for a new shift
  useEffect(() => {
    if (
      open &&
      !shift &&
      participants.length > 0 &&
      formData.participant_ids.length === 0 &&
      formData.house_id
    ) {
      const houseParticipants = participants
        .filter(
          (p) => p.house_id === formData.house_id && p.status === 'active',
        )
        .map((p) => p.id);
      if (houseParticipants.length > 0) {
        setFormData((prev) => ({
          ...prev,
          participant_ids: houseParticipants,
        }));
      }
    }
  }, [
    open,
    shift,
    participants,
    formData.participant_ids.length,
    formData.house_id,
  ]);

  const handleSave = async () => {
    if (!formData.start_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in required date and time fields');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleHouseChange = (val: string) => {
    const houseId = val === 'none' ? null : val;
    const houseParticipants = houseId
      ? participants
          .filter((p) => p.house_id === houseId && p.status === 'active')
          .map((p) => p.id)
      : [];
    setFormData({
      ...formData,
      house_id: houseId,
      participant_ids: houseParticipants,
    });
  };

  const toggleParticipant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(id)
        ? prev.participant_ids.filter((p) => p !== id)
        : [...prev.participant_ids, id],
    }));
  };

  const toggleChecklist = (id: string, name: string) => {
    setFormData((prev) => {
      const isAssigned = prev.assigned_checklists.some(
        (ac) => ac.checklist_id === id,
      );
      return {
        ...prev,
        assigned_checklists: isAssigned
          ? prev.assigned_checklists.filter((ac) => ac.checklist_id !== id)
          : [
              ...prev.assigned_checklists,
              { checklist_id: id, assignment_title: name },
            ],
      };
    });
  };

  const handleShiftTemplateChange = async (val: string) => {
    const dynamicType = shiftTemplates?.find(
      (st) => st.id === val || st.shift_template_name === val,
    );
    const updatedData = {
      ...formData,
      shift_template_id: dynamicType?.id || null,
      shift_template: dynamicType?.shift_template_name || val,
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
              {formData.entry_type === 'event' ? (
                <Calendar className="size-5 sm:size-6" />
              ) : (
                <Clock className="size-5 sm:size-6" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-tight truncate">
                {formData.entry_type === 'event'
                  ? 'Calendar Event'
                  : isEdit
                    ? 'Update Shift'
                    : 'Create New Shift'}
              </DialogTitle>
              <DialogDescription className="text-xs truncate">
                {formData.entry_type === 'event'
                  ? `Commitment for ${formData.start_date}`
                  : isEdit
                    ? `Editing shift for ${formData.start_date}`
                    : 'Define the schedule and assignments'}
                {currentHouse && (
                  <span className="ml-1 text-primary font-bold">
                    • {currentHouse.house_name}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6 custom-scrollbar bg-white">
          {formData.entry_type === 'event' && formData.title && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                Event: {formData.title}
              </h4>
              {formData.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <MapPin className="size-3" /> {formData.location}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
                <User className="size-3" /> Assign Staff
              </Label>
              <Select
                value={formData.staff_id || 'none'}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    staff_id: val === 'none' ? null : val,
                  })
                }
                disabled={(readOnly || isStaffSelectionDisabled) && !isAdmin}
              >
                <SelectTrigger
                  className="h-10 sm:h-11 text-sm font-medium"
                  aria-label="Assign Staff"
                >
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem
                    value="none"
                    className="font-bold text-amber-600 italic"
                  >
                    Open Shift (Unassigned)
                  </SelectItem>
                  {filteredStaffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <SecureAvatar
                          src={s.photo_url || undefined}
                          initials={
                            s.staff_name?.substring(0, 2).toUpperCase() ?? '?'
                          }
                          className="size-5 sm:size-6"
                          bucket={STORAGE_BUCKETS.STAFF_PHOTOS}
                        />
                        <span className="text-sm">{s.staff_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.entry_type !== 'event' ? (
              <div className="space-y-1.5">
                <Label
                  htmlFor="shift_template"
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5"
                >
                  <Zap className="size-3" /> Shift Template *
                </Label>
                <Select
                  value={formData.shift_template_id || formData.shift_template}
                  onValueChange={handleShiftTemplateChange}
                  disabled={readOnly && !isAdmin}
                >
                  <SelectTrigger
                    className="h-10 sm:h-11 text-sm font-medium"
                    aria-label="Shift Template"
                  >
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTemplates.length > 0 ? (
                      shiftTemplates.map((st) => {
                        const Icon = SHIFT_ICONS[st.icon_name || ''] || Clock;
                        const iconColor = st.color_theme
                          ? `text-${st.color_theme.split('-')[0]}-500`
                          : 'text-primary';
                        return (
                          <SelectItem key={st.id} value={st.id}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn('size-3.5', iconColor)} />
                              <span>{st.shift_template_name}</span>
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="SIL">SIL</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
                  <Zap className="size-3" /> Entry Type
                </Label>
                <div className="h-10 sm:h-11 px-3 flex items-center text-sm font-bold bg-gray-50 rounded-lg border border-dashed border-gray-200 text-primary uppercase tracking-tight">
                  Calendar Event
                </div>
              </div>
            )}
          </div>

          {!preSelectedHouseId && !isEdit && (
            <div className="space-y-1.5 pt-4 border-t border-gray-100">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
                <Home className="size-3" /> Service Location
              </Label>
              <Select
                value={formData.house_id || 'none'}
                onValueChange={handleHouseChange}
                disabled={readOnly && !isAdmin}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm font-medium">
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone / No House</SelectItem>
                  {houses.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.house_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-4 sm:pt-5 border-t border-gray-100">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Shift Start
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      start_date: newDate,
                      end_date:
                        prev.end_date === prev.start_date || !prev.end_date
                          ? newDate
                          : prev.end_date,
                    }));
                  }}
                  className="h-10 sm:h-11 font-bold text-sm"
                  disabled={readOnly && !isAdmin}
                />
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="h-10 sm:h-11 w-28 sm:w-32 font-black text-sm"
                  disabled={readOnly && !isAdmin}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Shift End
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="h-10 sm:h-11 font-bold text-sm"
                  disabled={readOnly && !isAdmin}
                />
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="h-10 sm:h-11 w-28 sm:w-32 font-black text-sm"
                  disabled={readOnly && !isAdmin}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-5 border-t border-gray-100">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
              Participants Present
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {participants
                .filter(
                  (p) =>
                    (!formData.house_id || p.house_id === formData.house_id) &&
                    p.status === 'active',
                )
                .map((p) => (
                  <Label
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border transition-all cursor-pointer m-0',
                      formData.participant_ids.includes(p.id)
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-gray-50 border-gray-100 opacity-60 grayscale-[50%]',
                    )}
                  >
                    <Checkbox
                      checked={formData.participant_ids.includes(p.id)}
                      onCheckedChange={() => toggleParticipant(p.id)}
                      className="size-3.5 sm:size-4"
                    />
                    <SecureAvatar
                      src={p.photo_url}
                      initials={
                        p.participant_name?.substring(0, 2).toUpperCase() ?? '?'
                      }
                      className="size-6 shrink-0"
                      bucket={STORAGE_BUCKETS.PARTICIPANT_PHOTOS}
                    />
                    <div className="min-w-0 pointer-events-none">
                      <p className="text-[10px] sm:text-xs font-bold truncate m-0">
                        {p.participant_name}
                      </p>
                    </div>
                  </Label>
                ))}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-5 border-t border-gray-100">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
              Assigned Routine Checklists
            </Label>
            <ShiftChecklistPicker
              checklists={currentChecklists}
              selectedIds={formData.assigned_checklists.map(
                (ac) => ac.checklist_id,
              )}
              onToggle={toggleChecklist}
              readOnly={readOnly && !isAdmin}
            />
          </div>

          <div
            className="space-y-1.5 pt-4 sm:pt-5 border-t border-gray-100"
            id="shift-notes-section"
          >
            <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
              Internal Handover Notes
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Enter instructions for staff working this shift..."
              className="min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm"
              disabled={readOnly && !isAdmin}
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
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2 grow sm:grow-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="grow sm:grow-0 text-xs sm:text-sm h-9 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (readOnly && !isAdmin)}
              className="grow sm:grow-0 text-xs sm:text-sm h-9 sm:h-10 font-bold"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <CheckSquare className="size-4 mr-2" />
              )}
              {isEdit ? 'Save Changes' : 'Create Shift'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
