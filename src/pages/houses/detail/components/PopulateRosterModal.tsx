import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Clock, CheckSquare, Loader2, Play, AlertCircle, Copy, CheckCircle2, UserPlus } from 'lucide-react';
import { format, addDays, startOfTomorrow, endOfWeek, startOfWeek, eachDayOfInterval, getDay, differenceInCalendarDays, startOfDay } from 'date-fns';
import { useHouseShiftTypes } from '@/hooks/use-house-shift-types';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useHouseParticipants } from '@/hooks/useHouseParticipants';
import { useShiftTemplates } from '@/hooks/use-shift-templates';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn, getPeriodTheme } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useRosterData } from '@/components/roster/use-roster-data';

interface PopulateRosterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  houseName: string;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
  { id: 0, label: 'Sun', full: 'Sunday' },
];

export function PopulateRosterModal({ open, onOpenChange, houseId, houseName, onSuccess }: PopulateRosterModalProps) {
  const [startDate, setStartDate] = useState(format(startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [rotationWeeks, setRotationWeeks] = useState(1);
  
  // Pattern: Array of weeks, each is Record<dayIndex, shiftTypeId[]>
  const [pattern, setPattern] = useState<Record<number, string[]>[]>([
    { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] }
  ]);

  const { shiftTypes = [] } = useHouseShiftTypes(houseId);
  const { participants = [] } = useHouseParticipants(houseId);
  const { defaults = [] } = useShiftTemplates(houseId);
  const { materializePattern } = useRosterData();

  // Handle changing rotation length
  useEffect(() => {
    setPattern(prev => {
      if (prev.length === rotationWeeks) return prev;
      const newPattern = [...prev];
      while (newPattern.length < rotationWeeks) {
        // Clone the previous week's pattern as a starting point if available
        const lastWeek = newPattern[newPattern.length - 1] || { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
        newPattern.push(JSON.parse(JSON.stringify(lastWeek)));
      }
      return newPattern.slice(0, rotationWeeks);
    });
  }, [rotationWeeks]);

  // Auto-select all shift types for weekdays by default if they are active (only on first load)
  useEffect(() => {
    if (shiftTypes && shiftTypes.length > 0 && pattern.length > 0 && Object.values(pattern[0]).every(v => v.length === 0)) {
      const activeIds = shiftTypes.filter(t => t.is_active).map(t => t.id);
      setPattern(prev => {
        const newPattern = [...prev];
        const newWeek0 = { ...newPattern[0] };
        [1, 2, 3, 4, 5].forEach(day => {
          newWeek0[day] = [...activeIds];
        });
        newPattern[0] = newWeek0;
        return newPattern;
      });
    }
  }, [shiftTypes]);

  const toggleShiftInPattern = (weekIndex: number, dayIndex: number, shiftTypeId: string) => {
    setPattern(prev => {
      const newPattern = [...prev];
      const week = { ...newPattern[weekIndex] };
      const current = week[dayIndex] || [];
      week[dayIndex] = current.includes(shiftTypeId)
        ? current.filter(id => id !== shiftTypeId)
        : [...current, shiftTypeId];
      newPattern[weekIndex] = week;
      return newPattern;
    });
  };

  const copyMondayToWeekdays = (weekIndex: number) => {
    setPattern(prev => {
      const newPattern = [...prev];
      const week = { ...newPattern[weekIndex] };
      const mondayPattern = week[1] || [];
      [2, 3, 4, 5].forEach(day => {
        week[day] = [...mondayPattern];
      });
      newPattern[weekIndex] = week;
      return newPattern;
    });
    toast.success(`Monday pattern copied to weekdays for Week ${weekIndex + 1}`);
  };

  const copyWeekOneToAll = () => {
    setPattern(prev => {
      if (prev.length <= 1) return prev;
      const week1 = JSON.parse(JSON.stringify(prev[0]));
      return prev.map(() => JSON.parse(JSON.stringify(week1)));
    });
    toast.success('Week 1 pattern copied to all weeks');
  };

  const handlePopulate = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select a valid date range');
      return;
    }

    const intervalDays = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    }).length;

    if (intervalDays > 90) { // Increased to 90 for longer rotations
      toast.error('Maximum range is 90 days to ensure performance');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await materializePattern({
        houseId,
        houseName,
        startDate,
        endDate,
        pattern,
        shiftTypes,
        defaults,
        participants
      });

      toast.success('Roster populated successfully!', {
        description: `Created ${result.created} shifts with ${result.checklists} checklists.${result.skipped > 0 ? ` Skipped ${result.skipped} duplicates.` : ''}`
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Failed to populate roster', { description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const totalShiftsToCreate = useMemo(() => {
    try {
      const interval = eachDayOfInterval({
        start: new Date(startDate),
        end: new Date(endDate)
      });
      const startDay = startOfDay(new Date(startDate));
      
      return interval.reduce((acc, date) => {
        const dayIndex = getDay(date);
        const daysDiff = differenceInCalendarDays(startOfDay(date), startDay);
        const weekIndex = Math.floor(daysDiff / 7) % rotationWeeks;
        return acc + (pattern[weekIndex]?.[dayIndex]?.length || 0);
      }, 0);
    } catch (e) {
      return 0; // fallback if dates are invalid
    }
  }, [startDate, endDate, pattern, rotationWeeks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-6 pb-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Play className="size-6 text-primary fill-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Populate Roster</DialogTitle>
              <DialogDescription className="font-medium">
                Generate <span className="text-primary font-bold">Open Confirmed Shifts</span> for {houseName} based on your Shift Model.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30 custom-scrollbar">
          {/* Date Range Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                <CalendarDays className="size-3" /> Start Date
              </Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="h-12 text-base font-bold bg-gray-50/50 border-gray-200 focus:bg-white transition-all" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                <CalendarDays className="size-3" /> End Date
              </Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                min={startDate}
                className="h-12 text-base font-bold bg-gray-50/50 border-gray-200 focus:bg-white transition-all" 
              />
            </div>
          </div>

          {/* Rotation Settings & Pattern Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">Shift Pattern</h4>
                <p className="text-xs text-muted-foreground">Select which shift modes to include for each day.</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Rotation Length</Label>
                  <select 
                    value={rotationWeeks} 
                    onChange={e => setRotationWeeks(Number(e.target.value))}
                    className="h-8 text-xs font-bold border-gray-200 rounded-lg px-2 bg-white"
                  >
                    <option value={1}>1 Week</option>
                    <option value={2}>2 Weeks</option>
                    <option value={3}>3 Weeks</option>
                    <option value={4}>4 Weeks</option>
                  </select>
                </div>
                
                {rotationWeeks > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyWeekOneToAll}
                    className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <Copy className="size-3" /> Copy W1 to All
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {pattern.map((weekPattern, weekIndex) => (
                <div key={weekIndex} className="space-y-2 relative">
                  {rotationWeeks > 1 && (
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="text-xs font-black uppercase tracking-widest text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        Week {weekIndex + 1}
                      </h5>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end mb-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyMondayToWeekdays(weekIndex)}
                      className="h-6 text-[9px] font-bold uppercase tracking-widest gap-1.5 text-gray-500 hover:text-primary"
                    >
                      <Copy className="size-2.5" /> Copy Mon to Weekdays
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm">
                        <div className="bg-gray-50/80 px-3 py-2 border-b text-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{day.label}</span>
                        </div>
                        <div className="p-2 space-y-1.5 flex-1">
                          {shiftTypes.length > 0 ? (
                            shiftTypes.map(type => {
                              const isSelected = weekPattern[day.id]?.includes(type.id);
                              const theme = getPeriodTheme(type.name, type.color_theme, type.icon_name);
                              
                              return (
                                <div 
                                  key={type.id}
                                  onClick={() => toggleShiftInPattern(weekIndex, day.id, type.id)}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer group",
                                    isSelected 
                                      ? "bg-primary/[0.03] border-primary/20 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]" 
                                      : "bg-white border-transparent hover:bg-gray-50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                  )}
                                >
                                  <div className={cn(
                                    "size-5 rounded flex items-center justify-center shrink-0",
                                    isSelected ? theme.bg : "bg-gray-100"
                                  )}>
                                    <theme.icon className={cn("size-3", isSelected ? theme.text : "text-gray-400")} />
                                  </div>
                                  <span className={cn(
                                    "text-[10px] font-bold truncate leading-none",
                                    isSelected ? "text-gray-900" : "text-gray-400"
                                  )}>
                                    {type.short_name || type.name}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[9px] text-muted-foreground text-center py-4 italic">No models</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automatic Assignments Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex gap-4">
              <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <CheckSquare className="size-5 text-indigo-600" />
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-tight text-indigo-900">Routine Checklists</h5>
                <p className="text-[10px] text-indigo-700 leading-relaxed mt-1">
                  Every generated shift will automatically include the <strong>Default Checklists</strong> defined in your Shift Model.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex gap-4">
              <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <UserPlus className="size-5 text-emerald-600" />
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-tight text-emerald-900">Participant Link</h5>
                <p className="text-[10px] text-emerald-700 leading-relaxed mt-1">
                  All <strong>{participants.filter(p => p.status === 'active').length} active participants</strong> will be linked to these shifts for documentation compliance.
                </p>
              </div>
            </div>
          </div>

          {/* Warning/Info */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4">
            <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>Wait!</strong> This will create <strong>{totalShiftsToCreate} Confirmed Shifts</strong>. Confirmed shifts are immediately visible to staff. Shifts will be created without an assigned staff member (Open). 
              Duplicate checks are <strong>not</strong> performed; generating the same range twice will create double-up shifts.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-white border-t flex justify-between items-center sticky bottom-0 z-10">
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total to Create</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-primary">{totalShiftsToCreate}</span>
              <span className="text-sm font-bold text-gray-400">Shifts</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="font-bold border-gray-300 h-11 px-6" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={handlePopulate} 
              className="h-11 px-10 font-black uppercase tracking-tight shadow-lg shadow-primary/20 gap-2"
              disabled={isGenerating || totalShiftsToCreate === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="size-4 fill-white" />
                  Confirm & Populate
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
