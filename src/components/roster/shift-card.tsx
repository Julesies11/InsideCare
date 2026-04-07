import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ClipboardList, Clock, MapPin, User, Users, UserCheck, CheckCircle2, ChevronDown } from 'lucide-react';
import { getShiftTheme, formatTime } from './roster-utils';
import { SHIFT_ICONS, cn } from '@/lib/utils';

export interface ShiftCardData {
  id: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  shift_template: string;
  color_theme?: string;
  icon_name?: string;
  house?: { id: string; name: string };
  staff_name?: string;
  staff_id?: string;
  participants?: Array<{ id: string; name: string }>;
  assigned_checklists?: Array<{ id: string; checklist_id: string; assignment_title: string; is_completed?: boolean }>;
  notesCount?: number;
}

interface ShiftCardProps {
  shift: ShiftCardData;
  compact: boolean;
  showStaffName: boolean;
  showHouseName?: boolean;
  onClick: (e?: React.MouseEvent) => void;
  onWriteNote?: (shift: ShiftCardData) => void;
  onNotesClick?: (shift: ShiftCardData) => void;
  staffList?: Array<{ id: string; name: string }>;
  onQuickAssign?: (shiftId: string, staffId: string) => void;
}

export function ShiftCard({ shift, compact, showStaffName, showHouseName = true, onClick, onWriteNote, onNotesClick, staffList, onQuickAssign }: ShiftCardProps) {
  const participantCount = shift.participants?.length || 0;
  const checklistCount = shift.assigned_checklists?.length || 0;
  const isUnassigned = !shift.staff_id;
  const shiftThemeClasses = getShiftTheme(shift.color_theme, shift.shift_template);
  const IconComponent = SHIFT_ICONS[shift.icon_name || ''] || Clock;
  const textColor = shiftThemeClasses.split(' ').find(c => c.startsWith('text-'));

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "p-1.5 mb-1 bg-card border rounded cursor-pointer hover:bg-accent/50 transition-colors group",
          isUnassigned 
            ? "border-dashed border-gray-300 bg-gray-50/10" 
            : "border-solid border-emerald-500/50 bg-emerald-50/5 shadow-sm"
        )}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <IconComponent className={cn("h-2.5 w-2.5 shrink-0", textColor)} />
              <span className={cn("text-[9px] font-bold uppercase tracking-tight truncate", textColor)}>
                {shift.shift_template}
              </span>
            </div>
            <span className="text-[10px] leading-tight text-gray-700 font-normal">
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
              {shift.end_date && shift.end_date !== shift.start_date && (
                <span className="ml-0.5 text-orange-500" title="Overnight shift">+1</span>
              )}
            </span>
          </div>
        </div>

        {showStaffName && (
          <div className="flex items-center gap-1 mb-0.5 mt-1 border-t border-gray-100 pt-1">
            <User className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            {isUnassigned && onQuickAssign && staffList ? (
              <DropdownMenu onOpenChange={(open) => {
                if (open) {
                  console.log(`[QuickAssign Debug] Control: Compact Shift Card | Shift ID: ${shift.id} | House: ${shift.house?.name || 'Unassigned'} | Available Staff Count: ${staffList.length}`, {
                    staffList: staffList.map(s => ({ id: s.id, name: s.name, assignments: (s as any).house_assignments }))
                  });
                }
              }}>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="text-[10px] flex items-center justify-between gap-1 font-black text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded-md transition-all border border-amber-200 flex-1 cursor-pointer shadow-sm">
                    <span className="truncate uppercase">Assign Staff</span>
                    <ChevronDown className="size-2.5 shrink-0 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 max-h-[300px] overflow-y-auto">
                  {staffList.length > 0 ? (
                    staffList.map(s => (
                      <DropdownMenuItem 
                        key={s.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAssign(shift.id, s.id);
                        }}
                        className="text-xs cursor-pointer"
                      >
                        {s.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-[10px] text-muted-foreground italic">No staff assigned to this house</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className={`text-[10px] truncate font-normal ${isUnassigned ? 'text-amber-600' : 'text-gray-700'}`}>
                {isUnassigned ? 'OPEN SHIFT' : shift.staff_name}
              </span>
            )}
          </div>
        )}

        {showHouseName && shift.house && (
          <div className="flex items-center gap-1 mb-0.5">
            <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate font-normal">{shift.house.name}</span>
          </div>
        )}

        <div className="flex items-center gap-1 mb-0.5">
          <Users className={cn("h-2.5 w-2.5 shrink-0", participantCount === 0 ? "text-red-500" : "text-muted-foreground")} />
          <span className={cn(
            "text-[10px] font-normal",
            participantCount === 0 ? "text-red-600 font-bold" : "text-muted-foreground"
          )}>
            {participantCount} Participant{participantCount !== 1 ? 's' : ''}
          </span>
        </div>

        {shift.assigned_checklists && shift.assigned_checklists.length > 0 && (
          <div className="mt-1 pt-1 border-t border-dashed space-y-0.5">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Checklists</span>
            {shift.assigned_checklists.map((cl) => (
              <div key={cl.id} className="flex items-center gap-1">
                {cl.is_completed ? (
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                ) : (
                  <ClipboardList className="h-2.5 w-2.5 text-primary shrink-0" />
                )}
                <span className={cn(
                  "text-[9px] truncate",
                  cl.is_completed ? "text-emerald-600 font-bold" : "text-muted-foreground font-normal"
                )}>
                  {cl.assignment_title}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end mt-1 pt-1 border-t">
          <button
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (onNotesClick) { onNotesClick(shift); } else { onWriteNote?.(shift); } 
            }}
            className={`flex items-center gap-0.5 p-0.5 rounded transition-colors ${
              (shift.notesCount ?? 0) > 0
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-red-400 hover:text-red-500'
            }`}
          >
            <ClipboardList className="h-2.5 w-2.5" />
            <span className="text-[9px] font-normal">
              {shift.notesCount ?? 0}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-3 cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden group",
        isUnassigned 
          ? "border-dashed border-gray-300 bg-gray-50/5 shadow-inner" 
          : "border-solid border-emerald-500/50 bg-emerald-50/10 shadow-sm"
      )}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <IconComponent className={cn("size-3.5 shrink-0", textColor)} />
              <span className={cn("text-[11px] font-bold uppercase tracking-widest truncate", textColor)}>
                {shift.shift_template}
              </span>
            </div>
            <span className="text-sm text-gray-700 leading-none font-normal">
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
              {shift.end_date && shift.end_date !== shift.start_date && (
                <span className="ml-1 text-orange-500 text-[10px]" title="Overnight shift">+1 day</span>
              )}
            </span>
          </div>
          {isUnassigned && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] font-normal px-1 py-0 uppercase">Open</Badge>
          )}
        </div>
        
        <div className="space-y-1.5 mt-1 pt-1.5 border-t border-gray-100">
          {showStaffName && (
            <div className="flex items-center gap-2">
              <User className={`h-3.5 w-3.5 flex-shrink-0 ${isUnassigned ? 'text-amber-500' : 'text-gray-400'}`} />
              {isUnassigned && onQuickAssign && staffList ? (
                <DropdownMenu onOpenChange={(open) => {
                  if (open) {
                    console.log(`[QuickAssign Debug] Control: Expanded Shift Card | Shift ID: ${shift.id} | House: ${shift.house?.name || 'Unassigned'} | Available Staff Count: ${staffList.length}`, {
                      staffList: staffList.map(s => ({ id: s.id, name: s.name, assignments: (s as any).house_assignments }))
                    });
                  }
                }}>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="text-xs flex items-center justify-between gap-2 font-black text-amber-700 hover:text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 px-2 py-1 rounded-md transition-all border border-amber-200/50 flex-1 cursor-pointer shadow-sm">
                      <span className="truncate">ASSIGN STAFF</span>
                      <ChevronDown className="size-3 shrink-0 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
                    {staffList.length > 0 ? (
                      staffList.map(s => (
                        <DropdownMenuItem 
                          key={s.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickAssign(shift.id, s.id);
                          }}
                          className="text-sm cursor-pointer"
                        >
                          {s.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-3 text-xs text-muted-foreground italic text-center">No staff assigned to this house</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className={`text-xs truncate font-normal ${isUnassigned ? 'text-amber-700 uppercase tracking-tight' : 'text-gray-700'}`}>
                  {isUnassigned ? 'Unassigned' : shift.staff_name}
                </span>
              )}
            </div>
          )}

          {showHouseName && shift.house && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs truncate font-normal text-gray-600">{shift.house.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users className={cn("h-3.5 w-3.5 flex-shrink-0", participantCount === 0 ? "text-red-500" : "text-gray-400")} />
            <span className={cn(
              "text-xs truncate font-normal",
              participantCount === 0 ? "text-red-600 font-bold" : "text-gray-600"
            )}>
              {participantCount} Participant{participantCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {shift.assigned_checklists && shift.assigned_checklists.length > 0 && (
          <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-dashed">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Checklists</span>
            <div className="space-y-1">
              {shift.assigned_checklists.map((cl) => (
                <div key={cl.id} className="flex items-center gap-1.5">
                  {cl.is_completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                  <span className={cn(
                    "text-[10px] truncate",
                    cl.is_completed ? "text-emerald-600 font-bold" : "text-muted-foreground font-normal"
                  )}>
                    {cl.assignment_title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            if (onNotesClick) { onNotesClick(shift); } else { onWriteNote?.(shift); } 
          }}
          className={`w-full flex items-center justify-center gap-2 h-8 text-[10px] font-normal rounded-lg px-2 mt-1 transition-colors border ${
            (shift.notesCount ?? 0) > 0
              ? 'text-emerald-600 border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50'
              : 'text-red-400 border-red-50 bg-red-50/20 hover:bg-red-50'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          {shift.notesCount ?? 0} Note{(shift.notesCount ?? 0) !== 1 ? 's' : ''}
        </button>
      </div>
    </Card>
  );
}
