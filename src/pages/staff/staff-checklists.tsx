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
  shiftId?: string;
}

function HouseChecklistGroup({ 
  house, 
  todayStr, 
  onStartChecklist, 
  onResumeChecklist,
  isCurrentShift,
  shiftId
}: HouseChecklistGroupProps) {
  const { events = [], loading: loadingEvents } = useHouseChecklistEvents(house.id, todayStr, shiftId);

  const shiftChecklists = events.filter(e => e.id.startsWith('shift-cl-'));
  const scheduledHouseTasks = events.filter(e => !e.id.startsWith('shift-cl-'));

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
            
            const checklistItems = checklist.items || [];
            const previewItems = checklistItems.slice(0, 2);
            const remainingCount = Math.max(0, checklistItems.length - 2);

            return (
              <Card key={item.id} className={`flex flex-col h-full transition-all border-l-4 border-0 sm:border ${isCompleted ? 'border-l-green-500 bg-green-50/10' : isInProgress ? 'border-l-primary bg-primary/[0.02]' : 'border-l-gray-300'}`}>
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900 break-words whitespace-normal">
                        {item.title || checklist.name}
                      </h4>
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
                    variant={isCompleted ? "outline" : (isInProgress ? "primary" : "secondary")}
                    size="sm" 
                    className={`h-8 text-[10px] shadow-sm w-full mt-1 font-bold ${!isCompleted && !isInProgress ? 'border border-gray-300' : ''}`}
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
                    {isCompleted ? 'Review Completed' : (isInProgress ? 'Resume Checklist' : 'Start Checklist')}
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

export function StaffChecklists() {
  const { user, loading: authLoading } = useAuth();
  const { data: assignedHouses = [], isLoading: loadingHouses } = useStaffAssignedHouses(user?.staff_id);
  const { data: currentShift, isLoading: loadingShift } = useCurrentStaffShift(user?.staff_id);
  
  const [selectedCalendarHouseId, setSelectedCalendarHouseId] = useState<string | null>(null);
  
  const houseIds = useMemo(() => assignedHouses.map(h => h.house_id), [assignedHouses]);
  const { data: handoverIssues = [], isLoading: loadingHandover } = useHandoverIssues(houseIds);
  
  const calendarRef = useRef<any>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const isLoading = authLoading || loadingHouses || loadingShift;

  // Set default calendar house to current shift house or first assigned house
  useEffect(() => {
    if (!selectedCalendarHouseId && assignedHouses.length > 0) {
      if (currentShift?.house_id) {
        setSelectedCalendarHouseId(currentShift.house_id);
      } else {
        setSelectedCalendarHouseId(assignedHouses[0].house_id);
      }
    }
  }, [assignedHouses, currentShift, selectedCalendarHouseId]);

  // Sort houses so current shift house is first
  const sortedHouses = useMemo(() => {
    return [...assignedHouses].sort((a, b) => {
      if (a.house_id === currentShift?.house_id) return -1;
      if (b.house_id === currentShift?.house_id) return 1;
      return a.house.name.localeCompare(b.house.name);
    });
  }, [assignedHouses, currentShift]);

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
                    {sortedHouses.map((item) => (
                      <HouseChecklistGroup 
                        key={item.house_id}
                        house={item.house}
                        todayStr={todayStr}
                        isCurrentShift={item.house_id === currentShift?.house_id}
                        shiftId={item.house_id === currentShift?.house_id ? currentShift?.id : undefined}
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
                    ))}
                  </div>
                )}
              </div>

              {/* House Calendar Section */}
              {assignedHouses.length > 0 && (
                <div className="pt-10 border-t border-gray-100 flex flex-col gap-6" id="house_calendar">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="size-5 text-gray-500" />
                      <h2 className="text-xl font-bold text-gray-900">House Calendar</h2>
                    </div>
                    
                    {assignedHouses.length > 1 && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Viewing House:</span>
                        <Select 
                          value={selectedCalendarHouseId || ''} 
                          onValueChange={setSelectedCalendarHouseId}
                        >
                          <SelectTrigger className="w-[200px] h-9 text-xs font-semibold">
                            <SelectValue placeholder="Select House" />
                          </SelectTrigger>
                          <SelectContent>
                            {assignedHouses.map((h) => (
                              <SelectItem key={h.house_id} value={h.house_id}>
                                {h.house.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {selectedCalendarHouseId && (
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                      <HouseCalendarEvents 
                        ref={calendarRef}
                        houseId={selectedCalendarHouseId}
                        staffId={user?.staff_id}
                        canDelete={false} // Staff cannot delete/manage schedule
                        onRefreshNeeded={refreshAllTodayTasks}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </>
  );
}
