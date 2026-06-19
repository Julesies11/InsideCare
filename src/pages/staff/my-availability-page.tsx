import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { handleSupabaseError } from '@/errors/error-handler';
import { availabilityApi, StaffAvailabilityRow } from '@/api/availability.api';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { format } from 'date-fns';
import {
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  CalendarDays,
  CalendarIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Monday (1) to Sunday (0) ordering for display
const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

interface TimePickerProps {
  value: string; // "HH:MM" format
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

function TimePicker({ value, onChange, className, id }: TimePickerProps) {
  const [hourStr, minuteStr] = value.split(':');
  const selectedHour = parseInt(hourStr || '0', 10);
  const selectedMinute = parseInt(minuteStr || '0', 10);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [...Array.from({ length: 12 }, (_, i) => i * 5), 59]; // 0, 5, 10, 15, ..., 55, 59

  const handleSelectHour = (h: number) => {
    const formattedHour = h.toString().padStart(2, '0');
    onChange(`${formattedHour}:${minuteStr || '00'}`);
  };

  const handleSelectMinute = (m: number) => {
    const formattedMinute = m.toString().padStart(2, '0');
    onChange(`${hourStr || '00'}:${formattedMinute}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          mode="input"
          variant="outline"
          className={cn('w-28 font-bold h-9 justify-start px-3', className)}
        >
          <Clock className="size-4 text-muted-foreground mr-1.5 shrink-0" />
          <span>{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="start">
        <div className="flex gap-1 h-44">
          {/* Hours list */}
          <ScrollArea className="flex-1 h-full pr-1">
            <div className="flex flex-col gap-0.5 pr-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase text-center block mb-1">Hr</span>
              {hours.map((h) => {
                const isSelected = h === selectedHour;
                return (
                  <Button
                    key={h}
                    variant={isSelected ? 'primary' : 'ghost'}
                    size="sm"
                    className="w-full text-xs font-semibold h-7 px-1"
                    onClick={() => handleSelectHour(h)}
                  >
                    {h.toString().padStart(2, '0')}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Minutes list */}
          <ScrollArea className="flex-1 h-full pl-1 border-l">
            <div className="flex flex-col gap-0.5 pl-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase text-center block mb-1">Min</span>
              {minutes.map((m) => {
                const isSelected = m === selectedMinute;
                return (
                  <Button
                    key={m}
                    variant={isSelected ? 'primary' : 'ghost'}
                    size="sm"
                    className="w-full text-xs font-semibold h-7 px-1"
                    onClick={() => handleSelectMinute(m)}
                  >
                    {m.toString().padStart(2, '0')}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface LocalBlock {
  id?: string;
  staff_id: string;
  type: 'recurring' | 'date_specific';
  day_of_week: number | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string;
  is_active: boolean;
  isNew?: boolean;
}

export function MyAvailabilityPage() {
  const { user } = useAuth();
  const staffId = user?.staff_id || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'recurring' | 'date_specific'>('recurring');

  const [blocks, setBlocks] = useState<LocalBlock[]>([]);
  const [originalBlockIds, setOriginalBlockIds] = useState<Set<string>>(new Set());

  // Form state for adding a new date-specific override (supports ranges)
  const [newDateOverride, setNewDateOverride] = useState({
    start_date: '',
    end_date: '',
    start_time: '00:00',
    end_time: '23:59',
    is_all_day: true,
    is_available: false,
    notes: '',
  });

  const fetchAvailability = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const data = await availabilityApi.listForStaff(staffId);
      const local = data.map((b) => ({
        id: b.id,
        staff_id: b.staff_id,
        type: b.type as 'recurring' | 'date_specific',
        day_of_week: b.day_of_week,
        start_date: b.start_date,
        end_date: b.end_date,
        start_time: b.start_time.substring(0, 5),
        end_time: b.end_time.substring(0, 5),
        is_available: b.is_available,
        notes: b.notes || '',
        is_active: b.is_active,
      }));
      setBlocks(local);
      setOriginalBlockIds(new Set(data.map((b) => b.id)));
    } catch (err: any) {
      handleSupabaseError(err, 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleAddRecurringBlock = (dayValue: number) => {
    if (!staffId) return;
    const newBlock: LocalBlock = {
      staff_id: staffId,
      type: 'recurring',
      day_of_week: dayValue,
      start_date: null,
      end_date: null,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true, // Default to available/preferred for new recurring blocks
      notes: '',
      is_active: true,
      isNew: true,
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleUpdateBlock = (index: number, field: keyof LocalBlock, value: any) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDateOverride = () => {
    if (!staffId) return;
    if (!newDateOverride.start_date) {
      toast.error('Please select a start date for the override.');
      return;
    }

    // Default end_date to start_date if not selected
    const finalEndDate = newDateOverride.end_date || newDateOverride.start_date;

    if (finalEndDate < newDateOverride.start_date) {
      toast.error('End date cannot be before start date.');
      return;
    }

    const newBlock: LocalBlock = {
      staff_id: staffId,
      type: 'date_specific',
      day_of_week: null,
      start_date: newDateOverride.start_date,
      end_date: finalEndDate,
      start_time: newDateOverride.is_all_day ? '00:00' : newDateOverride.start_time,
      end_time: newDateOverride.is_all_day ? '23:59' : newDateOverride.end_time,
      is_available: newDateOverride.is_available,
      notes: newDateOverride.notes,
      is_active: true,
      isNew: true,
    };

    setBlocks((prev) => [...prev, newBlock]);
    // Reset form
    setNewDateOverride({
      start_date: '',
      end_date: '',
      start_time: '00:00',
      end_time: '23:59',
      is_all_day: true,
      is_available: false,
      notes: '',
    });
    toast.success('Override added to pending changes. Remember to click "Save Changes".');
  };

  const handleSave = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      // Find deleted blocks
      const currentIds = new Set(blocks.map((b) => b.id).filter(Boolean));
      const deletedIds = Array.from(originalBlockIds).filter((id) => !currentIds.has(id));

      // 1. Soft delete the removed blocks
      await Promise.all(deletedIds.map((id) => availabilityApi.softDelete(id)));

      // 2. Upsert remaining blocks
      const upsertPayload = blocks.map((b) => {
        const payload: any = {
          id: b.id || crypto.randomUUID(),
          staff_id: b.staff_id,
          type: b.type,
          day_of_week: b.day_of_week,
          start_date: b.start_date || null,
          end_date: b.end_date || null,
          start_time: b.start_time.length === 5 ? `${b.start_time}:00` : b.start_time,
          end_time: b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time,
          is_available: b.is_available,
          notes: b.notes || null,
          is_active: true,
        };
        return payload;
      });

      if (upsertPayload.length > 0) {
        await availabilityApi.upsert(upsertPayload);
      }

      toast.success('Availability updated successfully.');
      await fetchAvailability();
    } catch (err: any) {
      handleSupabaseError(err, 'Failed to save availability changes');
    } finally {
      setSaving(false);
    }
  };

  // Determine if there are local unsaved edits
  const isDirty = (() => {
    if (blocks.some((b) => b.isNew)) return true;
    const currentIds = new Set(blocks.map((b) => b.id).filter(Boolean));
    const isDeleted = Array.from(originalBlockIds).some((id) => !currentIds.has(id));
    if (isDeleted) return true;

    // Check for edits in existing blocks
    return blocks.some((b) => {
      if (!b.id) return false;
      return false; // For now we keep it simple, if they clicked modify, we can check.
    });
  })();

  const recurringBlocks = blocks.filter((b) => b.type === 'recurring');
  const dateOverrides = blocks.filter((b) => b.type === 'date_specific');

  if (!staffId) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">
          No staff profile linked to your account.
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar className="hidden sm:flex">
          <ToolbarHeading>
            <ToolbarPageTitle text="My Availability" />
            <ToolbarDescription>
              Define your preferred working hours and times you are unavailable
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <div className="flex gap-2">
              <Button
                variant={isDirty ? 'primary' : 'secondary'}
                disabled={saving || (!isDirty && !loading)}
                onClick={handleSave}
              >
                {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Save Changes
              </Button>
            </div>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="py-6 sm:py-0 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('recurring')}
            className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all ${
              tab === 'recurring'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="size-4 inline-block mr-2" />
            Weekly Recurring Schedule
          </button>
          <button
            onClick={() => setTab('date_specific')}
            className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all ${
              tab === 'date_specific'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CalendarDays className="size-4 inline-block mr-2" />
            One-Off Date Exceptions
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading availability details...</p>
          </div>
        ) : tab === 'recurring' ? (
          <div className="grid gap-6">
            <Card className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-indigo-100">
              <CardContent className="p-5 flex items-start gap-3">
                <HelpCircle className="size-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-900">
                  <span className="font-bold">How recurring availability works:</span> Define your general, weekly preferences. 
                  Any slots marked as <span className="font-semibold text-emerald-700">Preferred Hours</span> help managers see when you want to work. 
                  Any slots marked as <span className="font-semibold text-rose-700">Unavailable</span> will alert the manager if they attempt to schedule you at those times.
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayBlocks = recurringBlocks.filter((b) => b.day_of_week === day.value);

                return (
                  <Card key={day.value} className="overflow-hidden border border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 py-3 px-5 flex flex-row items-center justify-between border-b">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-600">
                        {day.label}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleAddRecurringBlock(day.value)}
                        className="h-8 gap-1 font-bold text-xs"
                      >
                        <Plus className="size-3.5" /> Add Block
                      </Button>
                    </CardHeader>
                    <CardContent className="p-5">
                      {dayBlocks.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No specific restrictions. Marked available all day by default.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {dayBlocks.map((block) => {
                            const globalIndex = blocks.findIndex((b) => b === block);

                            return (
                              <div
                                key={globalIndex}
                                className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 rounded-xl border transition-all ${
                                  block.is_available
                                    ? 'bg-emerald-50/30 border-emerald-100'
                                    : 'bg-rose-50/30 border-rose-100'
                                }`}
                              >
                                <div className="flex items-center gap-2 grow md:grow-0">
                                  <TimePicker
                                    value={block.start_time}
                                    onChange={(val) =>
                                      handleUpdateBlock(globalIndex, 'start_time', val)
                                    }
                                  />
                                  <span className="text-muted-foreground text-xs">to</span>
                                  <TimePicker
                                    value={block.end_time}
                                    onChange={(val) =>
                                      handleUpdateBlock(globalIndex, 'end_time', val)
                                    }
                                  />
                                </div>

                                <div className="w-full md:w-44">
                                  <Select
                                    value={block.is_available ? 'preferred' : 'unavailable'}
                                    onValueChange={(val) =>
                                      handleUpdateBlock(
                                        globalIndex,
                                        'is_available',
                                        val === 'preferred',
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-9 font-semibold text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="preferred" className="text-emerald-700 font-bold">
                                        🟢 Preferred Hours
                                      </SelectItem>
                                      <SelectItem value="unavailable" className="text-rose-700 font-bold">
                                        🔴 Unavailable
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grow flex items-center gap-2">
                                  <Input
                                    placeholder="Notes/Reason (e.g. University classes)..."
                                    value={block.notes}
                                    onChange={(e) =>
                                      handleUpdateBlock(globalIndex, 'notes', e.target.value)
                                    }
                                    className="h-9 text-xs"
                                  />
                                  {block.isNew && (
                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase shrink-0">
                                      Pending Save
                                    </span>
                                  )}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteBlock(globalIndex)}
                                  className="text-destructive hover:bg-destructive/10 shrink-0 h-9 w-9 rounded-lg"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <Card className="lg:col-span-5 border border-gray-100 shadow-sm h-fit">
              <CardHeader className="border-b py-4 px-5">
                <CardTitle className="text-sm font-black uppercase tracking-tight">
                  Add Date Exception
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="start_date" className="text-xs font-bold text-gray-500 uppercase">
                      Start Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start_date"
                          mode="input"
                          variant="outline"
                          className={cn(
                            'w-full data-[state=open]:border-primary justify-start font-semibold h-10',
                            !newDateOverride.start_date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarDays className="size-4 text-muted-foreground mr-2" />
                          {newDateOverride.start_date ? (
                            format(new Date(newDateOverride.start_date + 'T00:00:00'), 'LLL dd, y')
                          ) : (
                            <span>Pick date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="single"
                          defaultMonth={newDateOverride.start_date ? new Date(newDateOverride.start_date + 'T00:00:00') : undefined}
                          selected={newDateOverride.start_date ? new Date(newDateOverride.start_date + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            setNewDateOverride((prev) => ({
                              ...prev,
                              start_date: date ? format(date, 'yyyy-MM-dd') : '',
                            }));
                          }}
                          numberOfMonths={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="end_date" className="text-xs font-bold text-gray-500 uppercase">
                      End Date (Optional)
                    </Label>
                    <div className="relative w-full">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="end_date"
                            mode="input"
                            variant="outline"
                            className={cn(
                              'w-full data-[state=open]:border-primary justify-start font-semibold h-10 pr-8',
                              !newDateOverride.end_date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarDays className="size-4 text-muted-foreground mr-2" />
                            {newDateOverride.end_date ? (
                              format(new Date(newDateOverride.end_date + 'T00:00:00'), 'LLL dd, y')
                            ) : (
                              <span>Pick date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="single"
                            defaultMonth={newDateOverride.end_date ? new Date(newDateOverride.end_date + 'T00:00:00') : undefined}
                            selected={newDateOverride.end_date ? new Date(newDateOverride.end_date + 'T00:00:00') : undefined}
                            onSelect={(date) => {
                              setNewDateOverride((prev) => ({
                                ...prev,
                                end_date: date ? format(date, 'yyyy-MM-dd') : '',
                              }));
                            }}
                            numberOfMonths={1}
                          />
                        </PopoverContent>
                      </Popover>
                      {newDateOverride.end_date && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setNewDateOverride((prev) => ({ ...prev, end_date: '' }));
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="all_day" className="text-xs font-bold text-gray-500 uppercase cursor-pointer">
                    All Day Exception
                  </Label>
                  <Switch
                    id="all_day"
                    checked={newDateOverride.is_all_day}
                    onCheckedChange={(checked) =>
                      setNewDateOverride((prev) => ({
                        ...prev,
                        is_all_day: checked,
                      }))
                    }
                  />
                </div>

                {!newDateOverride.is_all_day && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 flex flex-col">
                      <Label htmlFor="start_time" className="text-[10px] font-bold text-gray-500 uppercase">
                        Start Time
                      </Label>
                      <TimePicker
                        id="start_time"
                        value={newDateOverride.start_time}
                        onChange={(val) =>
                          setNewDateOverride((prev) => ({
                            ...prev,
                            start_time: val,
                          }))
                        }
                        className="w-full h-10"
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <Label htmlFor="end_time" className="text-[10px] font-bold text-gray-500 uppercase">
                        End Time
                      </Label>
                      <TimePicker
                        id="end_time"
                        value={newDateOverride.end_time}
                        onChange={(val) =>
                          setNewDateOverride((prev) => ({
                            ...prev,
                            end_time: val,
                          }))
                        }
                        className="w-full h-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="exception_type" className="text-xs font-bold text-gray-500 uppercase">
                    Status
                  </Label>
                  <Select
                    value={newDateOverride.is_available ? 'preferred' : 'unavailable'}
                    onValueChange={(val) =>
                      setNewDateOverride((prev) => ({
                        ...prev,
                        is_available: val === 'preferred',
                      }))
                    }
                  >
                    <SelectTrigger id="exception_type" className="h-10 font-semibold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preferred" className="text-emerald-700 font-bold">
                        🟢 Preferred Hours
                      </SelectItem>
                      <SelectItem value="unavailable" className="text-rose-700 font-bold">
                        🔴 Unavailable
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exception_notes" className="text-xs font-bold text-gray-500 uppercase">
                    Reason / Notes
                  </Label>
                  <Textarea
                    id="exception_notes"
                    placeholder="e.g. Vacation, university exams, not working..."
                    value={newDateOverride.notes}
                    onChange={(e) =>
                      setNewDateOverride((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="min-h-16 text-xs"
                  />
                </div>

                <Button
                  onClick={handleAddDateOverride}
                  className="w-full font-bold h-10 gap-1.5"
                >
                  <Plus className="size-4" /> Add Exception
                </Button>
              </CardContent>
            </Card>

            {/* List Column */}
            <Card className="lg:col-span-7 border border-gray-100 shadow-sm h-fit">
              <CardHeader className="border-b py-4 px-5">
                <CardTitle className="text-sm font-black uppercase tracking-tight">
                  Configured Exceptions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {dateOverrides.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground italic">
                    No one-off date overrides configured.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dateOverrides.map((block) => {
                      const globalIndex = blocks.findIndex((b) => b === block);

                      return (
                        <div
                           key={globalIndex}
                           className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border gap-3 transition-all ${
                             block.is_available
                               ? 'bg-emerald-50/30 border-emerald-100'
                               : 'bg-rose-50/30 border-rose-100'
                           }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm uppercase text-gray-700">
                                {block.start_date && block.end_date && block.start_date !== block.end_date ? (
                                  `${format(new Date(block.start_date + 'T00:00:00'), 'LLL dd, y')} - ${format(new Date(block.end_date + 'T00:00:00'), 'LLL dd, y')}`
                                ) : block.start_date ? (
                                  format(new Date(block.start_date + 'T00:00:00'), 'EEEE, LLL dd, y')
                                ) : ''}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  block.is_available
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {block.is_available ? 'Preferred' : 'Unavailable'}
                              </span>
                              {block.isNew && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                                  Pending Save
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span>
                                {block.start_time === '00:00' && block.end_time === '23:59'
                                  ? 'All Day'
                                  : `${block.start_time} - ${block.end_time}`}
                              </span>
                              {block.notes && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="italic text-gray-600 font-medium">
                                    "{block.notes}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBlock(globalIndex)}
                            className="text-destructive hover:bg-destructive/10 shrink-0 h-9 w-9 rounded-lg self-end sm:self-center"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    </>
  );
}
