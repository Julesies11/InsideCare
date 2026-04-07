import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  shiftTemplateFilter: string;
  onShiftTemplateFilterChange: (value: string) => void;
  shiftTemplateList?: Array<{ id: string; name: string }>;
  
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;

  // Template actions
  onPopulateRoster?: () => void;
  onBulkAction?: () => void;
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
  shiftTemplateFilter,
  onShiftTemplateFilterChange,
  shiftTemplateList = [],
  statusFilter,
  onStatusFilterChange,
  onPopulateRoster: _onPopulateRoster,
  onBulkAction: _onBulkAction,
  isCopying: _isCopying = false,
}: RosterCalendarHeaderProps) {
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

        <Select value={shiftTemplateFilter} onValueChange={onShiftTemplateFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {shiftTemplateList.map(type => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="No Show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
