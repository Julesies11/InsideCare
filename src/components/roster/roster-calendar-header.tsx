import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Copy, Loader2, Settings2, CalendarDays } from 'lucide-react';
import { ViewMode } from './roster-utils';

interface RosterCalendarHeaderProps {
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Date navigation
  onNavigate: (direction: 'prev' | 'next') => void;
  getPeriodLabel: () => string;
  
  // Filter visibility flags
  showStaffFilter?: boolean;
  showParticipantFilter?: boolean;
  
  // Filter values and handlers
  staffFilter?: string;
  onStaffFilterChange?: (value: string) => void;
  staffList?: Array<{ id: string; name: string }>;
  
  participantFilter?: string;
  onParticipantFilterChange?: (value: string) => void;
  participantList?: Array<{ id: string; name: string }>;
  
  houseFilter: string;
  onHouseFilterChange: (value: string) => void;
  houseList: Array<{ id: string; name: string }>;
  
  shiftTypeFilter: string;
  onShiftTypeFilterChange: (value: string) => void;
  
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;

  // Template actions
  onApplyTemplate?: (weeks: number) => void;
  isCopying?: boolean;
}

export function RosterCalendarHeader({
  viewMode,
  onViewModeChange,
  onNavigate,
  getPeriodLabel,
  showStaffFilter = false,
  showParticipantFilter = false,
  staffFilter,
  onStaffFilterChange,
  staffList = [],
  participantFilter,
  onParticipantFilterChange,
  participantList = [],
  houseFilter,
  onHouseFilterChange,
  houseList,
  shiftTypeFilter,
  onShiftTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onApplyTemplate,
  isCopying = false,
}: RosterCalendarHeaderProps) {
  const selectedHouse = houseList.find(h => h.id === houseFilter);

  return (
    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
      {/* View Mode and Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewModeChange('today')} 
            className={viewMode === 'today' ? 'bg-accent' : ''}
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewModeChange('week')} 
            className={viewMode === 'week' ? 'bg-accent' : ''}
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewModeChange('month')} 
            className={viewMode === 'month' ? 'bg-accent' : ''}
          >
            Month
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[200px]">
            <p className="text-sm font-medium">{getPeriodLabel()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
        {showStaffFilter && onStaffFilterChange && (
          <Select value={staffFilter} onValueChange={onStaffFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staffList.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name || 'Unnamed Staff'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1 w-full sm:w-auto">
          <Select value={houseFilter} onValueChange={onHouseFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Houses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Houses</SelectItem>
              {houseList.map(house => (
                <SelectItem key={house.id} value={house.id}>
                  {house.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bulk Action for Selected House */}
          {houseFilter !== 'all' && onApplyTemplate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-10 border-primary/20 text-primary hover:bg-primary/5 shrink-0" 
                  disabled={isCopying}
                  title={`Templates for ${selectedHouse?.name}`}
                >
                  {isCopying ? <Loader2 className="size-4 animate-spin" /> : <Settings2 className="size-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Bulk Actions: {selectedHouse?.name}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onApplyTemplate(4)} className="cursor-pointer gap-2 py-2">
                  <CalendarDays className="size-4 text-primary/60" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Fill from Templates</span>
                    <span className="text-[10px] text-muted-foreground">Apply 7-day model for 4 weeks</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onApplyTemplate(12)} className="cursor-pointer gap-2 py-2">
                  <CalendarDays className="size-4 text-primary/60" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Fill for 3 Months</span>
                    <span className="text-[10px] text-muted-foreground">Apply 7-day model for 12 weeks</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {showParticipantFilter && onParticipantFilterChange && (
          <Select value={participantFilter} onValueChange={onParticipantFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Participants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Participants</SelectItem>
              {participantList.map(participant => (
                <SelectItem key={participant.id} value={participant.id}>
                  {participant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={shiftTypeFilter} onValueChange={onShiftTypeFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="SIL">SIL</SelectItem>
            <SelectItem value="Community">Community</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="No Show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
