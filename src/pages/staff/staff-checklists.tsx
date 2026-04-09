import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStaffAssignedHouses, AssignedHouse } from '@/hooks/use-staff-assigned-houses';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useHouseChecklistEvents, HouseChecklistEvent } from '@/hooks/use-house-checklist-events';
import { useCurrentStaffShift } from '@/hooks/use-current-staff-shift';
import { useHandoverIssues } from '@/hooks/use-handover-issues';
import { House, ClipboardCheck, Loader2, CheckSquare, AlertTriangle, CalendarDays, CheckCircle2, ArrowRight } from 'lucide-react';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/common/toolbar';
import { format } from 'date-fns';
import { HouseCalendarEvents } from '../houses/detail/components/house-calendar-events';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getPeriodTheme } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface HouseChecklistGroupProps {
  house: AssignedHouse['house'];
  todayStr: string;
  onStartChecklist: (checklist: any, event: any) => void;
  onResumeChecklist: (submission: any, checklist: any, event: any) => void;
  isCurrentShift?: boolean;
  currentShift?: any;
}

function HouseChecklistGroup({ 
  house, 
  todayStr, 
  onStartChecklist, 
  onResumeChecklist,
  isCurrentShift,
  currentShift
}: HouseChecklistGroupProps) {
  const shiftId = currentShift?.id;
  const { events = [], loading: loadingEvents } = useHouseChecklistEvents(house.id, todayStr, shiftId);

  const shiftChecklists = events.filter(e => e.id.startsWith('shift-cl-'));
  const scheduledHouseTasks = events.filter(e => !e.id.startsWith('shift-cl-'));

  // Calculate if shift is ending soon (within 30 minutes)
  const isShiftEndingSoon = useMemo(() => {
    if (!isCurrentShift || !currentShift?.end_time) return false;
    try {
      const now = new Date();
      const [hours, minutes] = currentShift.end_time.split(':').map(Number);
      const end = new Date();
      end.setHours(hours, minutes, 0);
      
      const diff = (end.getTime() - now.getTime()) / 60000;
      return diff > 0 && diff <= 30;
    } catch (e) {
      return false;
    }
  }, [isCurrentShift, currentShift]);

  if (!loadingEvents && events.length === 0) return null;

  const renderTaskGrid = (tasks: HouseChecklistEvent[], title: string, icon: any) => {
    if (tasks.length === 0) return null;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          {icon}
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
          {tasks.map((item) => {
            const checklist = item.checklist;
            if (!checklist) return null;

            const submission = item.latest_submission;
            const isCompleted = submission?.status === 'completed';
            const isInProgress = submission?.status === 'in_progress';
            
            const isMandatory = item.is_shift_routine;
            const isMandatoryIncomplete = isMandatory && !isCompleted && isShiftEndingSoon;
            
            const checklistItems = checklist.items || [];
            const previewItems = checklistItems.slice(0, 2);
            const remainingCount = Math.max(0, checklistItems.length - 2);

            return (
              <Card 
                key={item.id} 
                className={cn(
                  "flex flex-col h-full transition-all border-l-4 border-0 sm:border",
                  isCompleted ? "border-l-green-500 bg-green-50/10" : 
                  isInProgress ? "border-l-primary bg-primary/[0.02]" : "border-l-gray-300",
                  isMandatoryIncomplete && "border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20 animate-pulse"
                )}
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900 break-words whitespace-normal">
                        {item.title || checklist.name}
                      </h4>
                      {isMandatory && (
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-bold h-4 px-1.5 uppercase",
                          isCompleted ? "border-green-200 text-green-600" : "border-orange-200 text-orange-600"
                        )}>
                          Mandatory
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 pb-4">
                  <div className="space-y-2 relative before:absolute before:inset-y-0 before:left-[9px] before:w-[1px] before:bg-muted-foreground/10">
                    {checklistItems.length === 0 ? (
                      <div className="text-[10px] text-muted-foreground ml-6 py-1 italic">
                        No items
                      </div>
                    ) : (
                      previewItems.map((cli: any, index: number) => (
                        <div key={cli.id} className="flex items-start gap-2.5 relative z-10">
                          <div className={`shrink-0 size-4.5 rounded-full flex items-center justify-center text-[9px] font-bold ${isCompleted ? 'bg-green-500 text-white' : 'bg-background border border-muted-foreground/30 text-muted-foreground'}`}>
                            {isCompleted ? <CheckCircle2 className="size-2.5" /> : index + 1}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-[11px] font-medium break-words whitespace-normal ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{cli.title}</span>
                            {(() => {
                              const periodName = cli.group?.name || cli.group_title;
                              if (!periodName) return null;
                              const theme = getPeriodTheme(periodName, cli.group?.color_theme);
                              const Icon = theme.icon;
                              return (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Icon className={cn("size-2", theme.text)} />
                                  <span className={cn("text-[8px] font-bold uppercase tracking-tighter leading-none", theme.text)}>
                                    {periodName}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ))
                    )}
                    {remainingCount > 0 && (
                      <div className="ml-7 text-[9px] text-muted-foreground font-medium">
                        + {remainingCount} more...
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="p-3 pt-0 mt-auto border-t border-dashed border-gray-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between mt-3 mb-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                    {isCompleted ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[8px] font-bold px-1.5 h-4 uppercase">
                        Finalized Today
                      </Badge>
                    ) : isInProgress ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[8px] font-bold px-1.5 h-4 uppercase animate-pulse">
                        In Progress
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400 border-gray-200 text-[8px] font-bold px-1.5 h-4 uppercase">
                        Not Started
                      </Badge>
                    )}
                  </div>
                  
                  {submission && (
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] text-muted-foreground italic">Last update</span>
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {format(new Date(submission.updated_at), 'h:mm a')}
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    variant={isCompleted ? "outline" : (isInProgress ? "primary" : (isMandatoryIncomplete ? "primary" : "secondary"))}
                    size="sm" 
                    className={cn(
                      "h-8 text-[10px] shadow-sm w-full mt-1 font-bold",
                      !isCompleted && !isInProgress && !isMandatoryIncomplete && "border border-gray-300",
                      isMandatoryIncomplete && "bg-orange-600 hover:bg-orange-700 border-none shadow-orange-200"
                    )}
                    onClick={() => {
                      if (isInProgress || isCompleted) {
                        onResumeChecklist(submission, checklist, item);
                      } else {
                        onStartChecklist(checklist, item);
                      }
                    }}
                    disabled={checklistItems.length === 0 || (item.is_shift_routine && item.shift_id !== shiftId)}
                    title={(item.is_shift_routine && item.shift_id !== shiftId) ? "You can only execute routines assigned to your current active shift." : undefined}
                  >
                    {isCompleted ? 'Review Completed' : (isInProgress ? 'Resume Checklist' : (isMandatoryIncomplete ? 'Complete Routine Now' : 'Start Checklist'))}
                    <ArrowRight className="size-3 ms-1.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isCurrentShift ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <House className="size-4" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{house.name}</h3>
          {isCurrentShift && (
            <Badge className="bg-green-50 text-green-700 border-green-100 font-bold text-[9px] uppercase h-4 px-1.5">
              Current Shift
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {events.length} Tasks
        </span>
      </div>

      {loadingEvents ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2].map(i => (
            <Card key={i} className="h-[180px] animate-pulse bg-gray-50/50 border-gray-100" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground italic text-sm bg-gray-50/30 rounded-xl border border-dashed">
          No tasks for this house today.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {renderTaskGrid(shiftChecklists, "Shift Checklists", <CheckSquare className="size-3 text-primary" />)}
          {renderTaskGrid(scheduledHouseTasks, "Scheduled House Tasks", <CalendarDays className="size-3 text-gray-400" />)}
        </div>
      )}
    </div>
  );
}

import { useStaffShifts } from '@/hooks/use-staff-shifts';

export function StaffChecklists() {
  const { user, loading: authLoading } = useAuth();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const { data: assignedHouses = [], isLoading: loadingHouses } = useStaffAssignedHouses(user?.staff_id);
  const { data: todayShifts = [], isLoading: loadingShifts } = useStaffShifts(user?.staff_id, todayStr, todayStr);
  const { data: activeShift, isLoading: loadingActiveShift } = useCurrentStaffShift(user?.staff_id);
  
  const [selectedCalendarHouseId, setSelectedCalendarHouseId] = useState<string | null>(null);
  
  const houseIds = useMemo(() => assignedHouses.map(h => h.house_id), [assignedHouses]);
  const { data: handoverIssues = [], isLoading: loadingHandover } = useHandoverIssues(houseIds);
  
  const calendarRef = useRef<any>(null);

  const isLoading = authLoading || loadingHouses || loadingShifts || loadingActiveShift;

  // Set default calendar house to active shift house or first assigned house
  useEffect(() => {
    if (!selectedCalendarHouseId && assignedHouses.length > 0) {
      if (activeShift?.house_id) {
        setSelectedCalendarHouseId(activeShift.house_id);
      } else if (todayShifts.length > 0) {
        setSelectedCalendarHouseId(todayShifts[0].house_id);
      } else {
        setSelectedCalendarHouseId(assignedHouses[0].house_id);
      }
    }
  }, [assignedHouses, activeShift, todayShifts, selectedCalendarHouseId]);

  // Sort houses so current/today's shift houses are first
  const sortedHouses = useMemo(() => {
    return [...assignedHouses].sort((a, b) => {
      const aHasShift = todayShifts.some(s => s.house_id === a.house_id);
      const bHasShift = todayShifts.some(s => s.house_id === b.house_id);
      const aIsActive = activeShift?.house_id === a.house_id;
      const bIsActive = activeShift?.house_id === b.house_id;

      if (aIsActive && !bIsActive) return -1;
      if (bIsActive && !aIsActive) return 1;
      if (aHasShift && !bHasShift) return -1;
      if (bHasShift && !aHasShift) return 1;
      return a.house.name.localeCompare(b.house.name);
    });
  }, [assignedHouses, todayShifts, activeShift]);

  // Hook to get a refresh function for all today's tasks across all houses
  const queryClient = useQueryClient();
  const refreshAllTodayTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['house-checklist-events'] });
    if (calendarRef.current?.refresh) {
      calendarRef.current.refresh();
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle>House Checklists</ToolbarPageTitle>
            <ToolbarDescription>
              {format(new Date(), 'EEEE, do MMMM yyyy')}
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="py-3 lg:py-6">
        <div className="flex flex-col gap-8">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary/50" />
              <p className="text-sm text-muted-foreground animate-pulse">Organizing your agenda...</p>
            </div>
          ) : (
            <>
              {/* Handover Alert (Aggregated) */}
              {handoverIssues.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Handover Alerts ({handoverIssues.length})</h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Tasks were missed yesterday across {new Set(handoverIssues.map(i => i.house_id)).size} house(s). Please review.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 h-9 font-bold text-xs"
                    onClick={() => {
                      document.getElementById('house_calendar')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    REVIEW HANDOVER
                  </Button>
                </div>
              )}

              {/* Today's Tasks Section */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Today's Tasks
                    </h2>
                  </div>
                </div>

                {assignedHouses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <ClipboardCheck className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Assigned Houses</h3>
                      <p className="text-sm text-muted-foreground">
                        You are not currently assigned to any houses. Please contact an administrator.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-10">
                    {sortedHouses.map((item) => {
                      // Find the best shift to show for this house
                      const shiftForHouse = todayShifts.find(s => s.house_id === item.house_id) || 
                                          (activeShift?.house_id === item.house_id ? activeShift : undefined);
                      
                      return (
                        <HouseChecklistGroup 
                          key={item.house_id}
                          house={item.house}
                          todayStr={todayStr}
                          isCurrentShift={item.house_id === activeShift?.house_id}
                          currentShift={shiftForHouse}
                          onStartChecklist={(cl, event) => {
                            if (calendarRef.current) {
                              if (event) {
                                calendarRef.current.handleEditEvent({
                                  ...event,
                                  is_checklist_event: true,
                                  house_checklist_id: cl.id,
                                  event_date: todayStr
                                });
                              } else {
                                toast.info('Please select a scheduled checklist from the calendar.');
                              }
                            }
                          }}
                          onResumeChecklist={(sub, cl, event) => {
                            if (calendarRef.current) {
                              calendarRef.current.handleEditEvent({
                                ...event,
                                is_checklist_event: true,
                                house_checklist_id: cl.id,
                                event_date: todayStr,
                                submissions: [sub]
                              });
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Checklist Execution Provider (Hidden Calendar) */}
              {selectedCalendarHouseId && (
                <HouseCalendarEvents 
                  ref={calendarRef}
                  houseId={selectedCalendarHouseId}
                  staffId={user?.staff_id}
                  canEdit={false}
                  canDelete={false}
                  onRefreshNeeded={refreshAllTodayTasks}
                  hideCalendar={true}
                />
              )}
            </>
          )}
        </div>
      </Container>
    </>
  );
}
