import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import { StaffRosterCalendar, StaffRosterCalendarHandle } from './components/staff-roster-calendar';
import { RosterCalendarHeader } from '@/components/roster/roster-calendar-header';
import { ViewMode } from '@/components/roster/roster-utils';
import { supabase } from '@/lib/supabase';
import { format, addWeeks, addMonths, addDays } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useHouseChecklists } from '@/hooks/use-house-checklists';

interface Staff {
  id: string;
  name: string;
  photo_url?: string | null;
  status?: string;
}

interface House {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  status?: string;
}

export function RosterBoardContent() {
  const calendarRef = useRef<StaffRosterCalendarHandle>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupByHouse, setGroupByHouse] = useState(true);
  
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { houseChecklists } = useHouseChecklists();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load staff
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, name, photo_url, status')
      .eq('status', 'active')
      .not('name', 'is', null)
      .order('name');

    if (!staffError && staffData) {
      setStaff(staffData as Staff[]);
    }

    // Load houses
    const { data: housesData, error: housesError } = await supabase
      .from('houses')
      .select('id, name')
      .eq('status', 'active')
      .order('name');

    if (!housesError && housesData) {
      setHouses(housesData);
    }

    // Load participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('id, name, status')
      .eq('status', 'active')
      .not('name', 'is', null)
      .order('name');

    if (!participantsError && participantsData) {
      setParticipants(participantsData as Participant[]);
    }

    setLoading(false);
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'today') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'today') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(currentDate.getDate() - daysToMonday);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Roster Board</h1>
          <p className="text-muted-foreground text-sm">Manage shift schedules and staff assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">Orchestrating Quality Care</h3>
              <p className="text-indigo-700 text-sm">
                Strategic roster management ensures consistent, reliable support for every participant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="group-by-house"
              checked={groupByHouse}
              onCheckedChange={setGroupByHouse}
            />
            <Label htmlFor="group-by-house">Group By House</Label>
          </div>
          
          <RosterCalendarHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNavigate={navigatePeriod}
            getPeriodLabel={getPeriodLabel}
            showStaffFilter={true}
            showParticipantFilter={true}
            staffFilter={selectedStaffId}
            onStaffFilterChange={setSelectedStaffId}
            staffList={staff}
            participantFilter={participantFilter}
            onParticipantFilterChange={setParticipantFilter}
            participantList={participants}
            houseFilter={houseFilter}
            onHouseFilterChange={setHouseFilter}
            houseList={houses}
            shiftTypeFilter={shiftTypeFilter}
            onShiftTypeFilterChange={setShiftTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onApplyTemplate={(weeks) => calendarRef.current?.applyTemplate(weeks)}
            isCopying={calendarRef.current?.isCopying}
          />
        </CardContent>
      </Card>

      {/* Calendar */}
      {!loading && (
        <StaffRosterCalendar
          ref={calendarRef}
          staffId={selectedStaffId}
          viewMode={viewMode}
          currentDate={currentDate}
          houseFilter={houseFilter}
          participantFilter={participantFilter}
          shiftTypeFilter={shiftTypeFilter}
          statusFilter={statusFilter}
          canEdit={true}
          groupByHouse={groupByHouse}
          checklists={houseChecklists}
        />
      )}
    </div>
  );
}
