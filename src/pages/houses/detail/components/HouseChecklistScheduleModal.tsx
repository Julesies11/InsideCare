import { useState } from 'react';
import { rosterApi } from '@/api/roster.api';
import { useQueryClient } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import {
  CalendarDays,
  ClipboardList,
  Info,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/config/query-keys';
import { cn } from '@/lib/utils';
import { useHouseShiftTemplates } from '@/hooks/use-house-shift-templates';
import { useChecklistSchedules } from '@/hooks/useChecklistSchedules';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RRuleGenerator } from './RRuleGenerator';

interface HouseChecklistScheduleModalProps {
  open: boolean;
  onClose: () => void;
  houseId: string;
  checklist: {
    id: string;
    house_checklist_name?: string;
    name?: string;
  } | null;
  onSuccess?: () => void;
}

type AssignmentPath = 'calendar' | 'shift';

export function HouseChecklistScheduleModal({
  open,
  onClose,
  houseId,
  checklist,
  onSuccess,
}: HouseChecklistScheduleModalProps) {
  const queryClient = useQueryClient();
  const [path, setAssignmentPath] = useState<AssignmentPath>('calendar');
  const [rrule, setRrule] = useState('');
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(
    format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
  );

  const { createSchedule, loading: loadingSchedule } =
    useChecklistSchedules(houseId);
  const { shiftTemplates, loading: loadingShifts } =
    useHouseShiftTemplates(houseId);

  const handleSave = async () => {
    if (!checklist) return;

    const checklistId =
      checklist.id ||
      (checklist as any).house_checklist_id ||
      (checklist as any).checklist_id;

    if (!checklistId || checklistId.startsWith('temp-')) {
      toast.error(
        'Please click "Save Changes" to save this checklist before scheduling it on the calendar.',
      );
      return;
    }

    try {
      if (path === 'calendar') {
        if (!rrule) {
          toast.error('Please define a frequency for the calendar tasks.');
          return;
        }
        await createSchedule({
          house_id: houseId,
          house_checklist_id: checklistId,
          rrule,
          start_date: startDate,
          end_date: endDate,
          target_shift: 'all',
          is_active: true,
        });
      } else {
        if (selectedShiftIds.length === 0) {
          toast.error('Please select at least one shift routine target.');
          return;
        }

        // Save logic for shift_assigned_checklists
        await rosterApi.appendShiftAssignments(
          selectedShiftIds.map((stId) => ({
            house_id: houseId,
            checklist_id: checklistId,
            shift_template_id: stId,
            assignment_title:
              checklist.house_checklist_name ||
              checklist.name ||
              'Routine Checklist',
          })),
        );

        toast.success('Checklist linked to shift routines.');
      }
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CALENDAR_EVENTS],
      });
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECKLISTS],
      });
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SHIFT_ASSIGNED_CHECKLISTS],
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Failed to schedule: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="size-6 text-primary" />
            Schedule "{checklist?.house_checklist_name || checklist?.name}"
          </DialogTitle>
          <DialogDescription>
            Choose how this checklist should be deployed in the house.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Step 1: Choose Path */}
          <RadioGroup
            value={path}
            onValueChange={(v) => setAssignmentPath(v as AssignmentPath)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="calendar"
                id="path-calendar"
                className="peer sr-only"
              />
              <Label
                htmlFor="path-calendar"
                className={cn(
                  'flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all',
                  path === 'calendar'
                    ? 'border-primary bg-primary/5'
                    : 'opacity-60',
                )}
              >
                <ClipboardList className="mb-3 h-6 w-6 text-primary" />
                <span className="font-bold text-sm uppercase tracking-tight">
                  House Calendar
                </span>
                <span className="text-[10px] text-center mt-1 text-muted-foreground leading-tight">
                  Shared facility tasks visible to everyone on specific days.
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="shift"
                id="path-shift"
                className="peer sr-only"
              />
              <Label
                htmlFor="path-shift"
                className={cn(
                  'flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all',
                  path === 'shift'
                    ? 'border-primary bg-primary/5'
                    : 'opacity-60',
                )}
              >
                <UserCheck className="mb-3 h-6 w-6 text-primary" />
                <span className="font-bold text-sm uppercase tracking-tight">
                  Shift Routine
                </span>
                <span className="text-[10px] text-center mt-1 text-muted-foreground leading-tight">
                  Individual tasks linked directly to a rostered work period.
                </span>
              </Label>
            </div>
          </RadioGroup>

          {/* Step 2: Configuration */}
          <div className="pt-4 border-t border-dashed">
            {path === 'calendar' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Calendar Frequency
                  </span>
                </div>

                <RRuleGenerator onChange={setRrule} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="start_date"
                      className="text-[10px] font-bold uppercase text-muted-foreground"
                    >
                      Start Date
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="end_date"
                      className="text-[10px] font-bold uppercase text-muted-foreground"
                    >
                      End Date
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="size-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Shift Targeting
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {loadingShifts ? (
                    <div className="flex items-center gap-2 text-muted-foreground italic text-xs py-4">
                      <Loader2 className="size-3 animate-spin" /> Loading shift
                      templates...
                    </div>
                  ) : shiftTemplates.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-xs text-amber-700">
                      No dynamic shift templates defined for this house. Please
                      define your shift templates first.
                    </div>
                  ) : (
                    shiftTemplates.map((st) => (
                      <div
                        key={st.id}
                        className={cn(
                          'flex items-center justify-between p-3 border rounded-xl transition-all cursor-pointer hover:bg-gray-50',
                          selectedShiftIds.includes(st.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200',
                        )}
                        onClick={() => {
                          setSelectedShiftIds((prev) =>
                            prev.includes(st.id)
                              ? prev.filter((id) => id !== st.id)
                              : [...prev, st.id],
                          );
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedShiftIds.includes(st.id)}
                            onCheckedChange={() => {}} // Controlled by row click
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {st.name} Shift
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Assigns to all {st.name} roster entries
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground bg-gray-50 p-3 rounded-lg border border-dashed italic">
                  Shift routines apply to EVERY occurrence of the selected
                  shifts. For tasks that only happen on specific days, use the{' '}
                  <strong>House Calendar</strong> path.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-gray-50 p-6 -m-6 mt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loadingSchedule}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              loadingSchedule ||
              (path === 'calendar' && !rrule) ||
              (path === 'shift' && selectedShiftIds.length === 0)
            }
            className="px-8 font-bold"
          >
            {loadingSchedule ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Confirm Schedule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
