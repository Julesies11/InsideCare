import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarDays, Loader2, CalendarCheck, Copy, CheckSquare } from 'lucide-react';
import { format, addDays, startOfWeek, isBefore, startOfDay } from 'date-fns';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/context/auth-context';

interface ScheduleChecklistsModalProps {
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

export function ScheduleChecklistsModal({ open, onOpenChange, houseId, houseName, onSuccess }: ScheduleChecklistsModalProps) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(format(startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [weeksToGenerate, setWeeksToGenerate] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Pattern: Array of weeks, each is Record<dayIndex, checklistId[]>
  const [pattern, setPattern] = useState<Record<number, string[]>[]>([
    { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] }
  ]);

  const { houseChecklists = [], loading: checklistsLoading } = useHouseChecklists(houseId);

  // Handle changing weeks to generate
  useEffect(() => {
    if (!open) return;
    setPattern(prev => {
      if (prev.length === weeksToGenerate) return prev;
      const newPattern = [...prev];
      while (newPattern.length < weeksToGenerate) {
        // Clone the previous week's pattern as a starting point if available
        const lastWeek = newPattern[newPattern.length - 1] || { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
        newPattern.push(JSON.parse(JSON.stringify(lastWeek)));
      }
      return newPattern.slice(0, weeksToGenerate);
    });
  }, [weeksToGenerate, open]);

  const toggleChecklistInPattern = (weekIndex: number, dayIndex: number, checklistId: string) => {
    setPattern(prev => {
      const newPattern = [...prev];
      const week = { ...newPattern[weekIndex] };
      const current = week[dayIndex] || [];
      week[dayIndex] = current.includes(checklistId)
        ? current.filter(id => id !== checklistId)
        : [...current, checklistId];
      newPattern[weekIndex] = week;
      return newPattern;
    });
  };

  const copyWeekOneToAll = () => {
    setPattern(prev => {
      if (prev.length <= 1) return prev;
      const week1 = JSON.parse(JSON.stringify(prev[0]));
      return prev.map(() => JSON.parse(JSON.stringify(week1)));
    });
    toast.success('Week 1 pattern copied to all weeks');
  };

  const copyMonToWeekdays = (weekIndex: number) => {
    setPattern(prev => {
      const next = [...prev];
      const w = { ...next[weekIndex] };
      const monPattern = w[1] || [];
      [2, 3, 4, 5].forEach(day => { w[day] = [...monPattern]; });
      next[weekIndex] = w;
      return next;
    });
    toast.success(`Monday pattern copied to weekdays for Week ${weekIndex + 1}`);
  };

  const handlePopulate = async () => {
    if (!startDate) {
      toast.error('Please select a valid start date');
      return;
    }

    setIsGenerating(true);
    try {
      const eventsToInsert: any[] = [];
      const currentStaffId = user?.staff_id || null;

      pattern.forEach((weekPattern, weekIndex) => {
        const anchorMonday = startOfWeek(new Date(startDate), { weekStartsOn: 1 });
        const weekStartDate = addDays(anchorMonday, weekIndex * 7);

        Object.entries(weekPattern).forEach(([dayIdStr, checklistIds]) => {
          const dayId = Number(dayIdStr);
          if (checklistIds.length === 0) return;

          const dayOffset = dayId === 0 ? 6 : dayId - 1;
          const eventDate = format(addDays(weekStartDate, dayOffset), 'yyyy-MM-dd');

          checklistIds.forEach(checklistId => {
            const checklist = houseChecklists.find(cl => cl.id === checklistId);
            if (!checklist) return;

            eventsToInsert.push({
              house_id: houseId,
              title: checklist.name,
              event_date: eventDate,
              is_checklist_event: true,
              house_checklist_id: checklist.id,
              created_by: currentStaffId,
            });
          });
        });
      });

      if (eventsToInsert.length > 0) {
        const { error } = await supabase
          .from('house_calendar_events')
          .insert(eventsToInsert);

        if (error) throw error;
      }

      toast.success('Checklists scheduled successfully!', {
        description: `Scheduled ${eventsToInsert.length} checklist events.`
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Failed to schedule checklists', { description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const totalEventsToCreate = useMemo(() => {
    return pattern.reduce((acc, week) => {
      return acc + Object.values(week).reduce((weekAcc, dayChecklists) => weekAcc + dayChecklists.length, 0);
    }, 0);
  }, [pattern]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-4 sm:p-5 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarCheck className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none mb-1">Schedule Checklists</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm font-medium">
                Bulk schedule House Checklists on specific days for {houseName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6 space-y-5 bg-gray-50/30 custom-scrollbar">
          {/* Date Range Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
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
              <Label htmlFor="rotation-length" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                <CalendarDays className="size-3" /> Schedule Length
              </Label>
              <select
                id="rotation-length"
                value={weeksToGenerate}
                onChange={e => setWeeksToGenerate(Number(e.target.value))}
                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-gray-50/50 px-3 py-2 text-base font-bold ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <option value="1">1 Week</option>
                <option value="2">2 Weeks</option>
                <option value="3">3 Weeks</option>
                <option value="4">4 Weeks</option>
                <option value="8">8 Weeks</option>
                <option value="12">12 Weeks</option>
              </select>
            </div>
          </div>

          {/* Settings & Pattern Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">Checklist Pattern</h4>
                <p className="text-xs text-muted-foreground">Select which checklists to schedule for each day.</p>
              </div>
              
              <div className="flex items-center gap-4">
                {weeksToGenerate > 1 && (
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
              {pattern.map((weekPattern, weekIndex) => {
                const anchorMonday = startOfWeek(new Date(startDate), { weekStartsOn: 1 });
                const weekStartDate = addDays(anchorMonday, weekIndex * 7);
                const weekEndDate = addDays(weekStartDate, 6);
                
                return (
                  <div key={weekIndex} className="space-y-2 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black uppercase tracking-widest text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          Week {weekIndex + 1}
                        </h5>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                        </span>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyMonToWeekdays(weekIndex)}
                        className="h-7 text-[9px] font-bold uppercase tracking-widest"
                      >
                        Copy Mon to Weekdays
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {DAYS_OF_WEEK.map(day => {
                        const dayOffset = day.id === 0 ? 6 : day.id - 1;
                        const cellDate = addDays(weekStartDate, dayOffset);
                        const isBeforeStart = isBefore(cellDate, startOfDay(new Date(startDate)));
                        
                        return (
                          <div key={day.id} className={cn(
                            "bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm transition-opacity",
                            isBeforeStart && "opacity-40 pointer-events-none grayscale bg-gray-50/50"
                          )}>
                            <div className="bg-gray-50/80 px-3 py-2 border-b text-center flex flex-col gap-0.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{day.label}</span>
                              <span className="text-[9px] font-bold text-primary/60">{format(cellDate, 'MMM d')}</span>
                            </div>
                            <div className="p-2 space-y-1.5 flex-1 relative">
                              {isBeforeStart && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 rotate-[-15deg] border border-gray-300 px-1 rounded bg-white/80">
                                    Before Start
                                  </span>
                                </div>
                              )}
                              {checklistsLoading ? (
                                <p className="text-[9px] text-muted-foreground text-center py-4">Loading...</p>
                              ) : houseChecklists.length > 0 ? (
                                houseChecklists.map(checklist => {
                                  const isSelected = !isBeforeStart && weekPattern[day.id]?.includes(checklist.id);
                                  
                                  return (
                                    <div 
                                      key={checklist.id}
                                      onClick={() => !isBeforeStart && toggleChecklistInPattern(weekIndex, day.id, checklist.id)}
                                      className={cn(
                                        "flex items-start gap-2 p-2 rounded-lg border transition-all group",
                                        !isBeforeStart && "cursor-pointer",
                                        isSelected 
                                          ? "bg-primary/[0.03] border-primary/20 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]" 
                                          : "bg-white border-transparent hover:bg-gray-50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                      )}
                                    >
                                      <div className={cn(
                                        "size-5 rounded flex items-center justify-center shrink-0 mt-0.5",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-400"
                                      )}>
                                        <CheckSquare className="size-3" />
                                      </div>
                                      <span className={cn(
                                        "text-[10px] font-bold leading-tight break-words pt-0.5",
                                        isSelected ? "text-gray-900" : "text-gray-400"
                                      )} title={checklist.name}>
                                        {checklist.name}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-[9px] text-muted-foreground text-center py-4 italic">No checklists</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-white border-t flex justify-between items-center sticky bottom-0 z-10">
          <div className="text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total to Create</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-primary">{totalEventsToCreate}</span>
              <span className="text-sm font-bold text-gray-400">Checklists</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="font-bold border-gray-300 h-11 px-6" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={handlePopulate} 
              className="h-11 px-10 font-black uppercase tracking-tight shadow-lg shadow-primary/20 gap-2"
              disabled={isGenerating || totalEventsToCreate === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarCheck className="size-4 text-white" />
                  Confirm & Schedule
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
